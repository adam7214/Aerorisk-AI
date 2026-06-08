"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Likelihood, Prisma, ReviewDecision, Severity, WorkflowStatus } from "@prisma/client";
import { AIConfigurationError, classifyReportWithMetadata, InvalidAIResponseError, type ReportAnalysis } from "@/lib/ai/classifyReport";
import { classifySafetyReport } from "@/lib/mock-ai";
import { prisma } from "@/lib/prisma";
import { assessRisk, type Likelihood as RiskLikelihood, type Severity as RiskSeverity } from "@/lib/risk";

export type CreateReportState = { error?: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createReport(_previousState: CreateReportState, formData: FormData): Promise<CreateReportState> {
  const narrative = textValue(formData, "narrative");
  if (!narrative) return { error: "Enter a deidentified narrative before running AI analysis." };

  const title = textValue(formData, "title") || "Untitled safety report";
  const eventDate = new Date(textValue(formData, "eventDate") || Date.now());
  const location = textValue(formData, "location") || "Unknown";
  const phaseOfFlight = textValue(formData, "phaseOfFlight") || "Unknown";
  const reporterRole = textValue(formData, "reporterRole") || "Unknown";
  const assignedReviewer = textValue(formData, "assignedReviewer") || null;
  const analysisMode = textValue(formData, "analysisMode") || "mock";
  const tags = textValue(formData, "tags").split(",").map((tag) => tag.trim()).filter(Boolean);

  if (analysisMode !== "openai") {
    const mock = classifySafetyReport(narrative);
    const recommendedRisk = assessRisk(mock.recommendedSeverity, mock.recommendedLikelihood);
    const mockValidatedOutput = {
      summary: mock.summary,
      possible_hazards: mock.hazards.map((hazard) => hazard.category),
      contributing_factors: ["Keyword match in deidentified narrative"],
      sms_category: mock.hazards[0]?.category ?? "Operational Safety Event",
      severity_indicators: [`Draft severity indicator: ${mock.recommendedSeverity}`],
      likelihood_indicators: [`Draft likelihood indicator: ${mock.recommendedLikelihood}`],
      recommended_safety_questions: ["What additional operational context should a qualified safety reviewer consider?", "Are there similar reports that indicate recurrence or trend risk?"],
      confidence_level: "medium",
      explainability_note: mock.rationale,
      human_review_required: true
    };

    const report = await prisma.report.create({
      data: {
        title, narrative, eventDate, location, phaseOfFlight, reporterRole, tags, assignedReviewer,
        status: WorkflowStatus.HUMAN_REVIEW_REQUIRED,
        aiAnalysis: { create: { modelName: "AeroRisk Mock Classifier", modelVersion: "0.1.0-deterministic", promptVersion: "mock-keyword-v1", summary: mock.summary, rationale: mock.rationale, confidenceScore: mock.confidenceScore, recommendedStatus: WorkflowStatus.HUMAN_REVIEW_REQUIRED, recommendedSeverity: mock.recommendedSeverity, recommendedLikelihood: mock.recommendedLikelihood, recommendedRiskLevel: mock.recommendedRiskLevel, validatedOutput: mockValidatedOutput } },
        hazards: { create: mock.hazards },
        riskAssessments: { create: { severity: mock.recommendedSeverity, likelihood: mock.recommendedLikelihood, riskLevel: recommendedRisk.riskLevel, score: recommendedRisk.score, source: "Mock AI recommendation", notes: "Initial deterministic mock classifier recommendation pending human review." } },
        governanceChecklist: { create: { deidentified: true, rationaleReviewed: false, humanDecisionRecorded: false, riskOwnerAssigned: Boolean(assignedReviewer), escalationChecked: false, limitationsAcknowledged: false, notes: "Created with deterministic mock output pending human review." } },
        auditLogs: { create: [
          { actor: "System", action: "Report created", details: "Deidentified safety report submitted for AI-assisted triage.", toStatus: WorkflowStatus.AI_DRAFT },
          { actor: "Mock AI", action: "Mock AI recommendation generated", details: `${mock.summary} Recommended ${mock.recommendedRiskLevel} draft risk.`, modelName: "AeroRisk Mock Classifier", promptVersion: "mock-keyword-v1", validatedAiOutput: mockValidatedOutput, aiResponseTimestamp: new Date(), fromStatus: WorkflowStatus.AI_DRAFT, toStatus: WorkflowStatus.HUMAN_REVIEW_REQUIRED }
        ] }
      }
    });
    revalidatePath("/");
    redirect(`/reports/${report.id}`);
  }

  let aiResult: Awaited<ReturnType<typeof classifyReportWithMetadata>>;
  try {
    aiResult = await classifyReportWithMetadata(narrative);
  } catch (error) {
    if (error instanceof InvalidAIResponseError) return { error: "AI analysis returned an invalid structure. Nothing was saved; please retry or use the mock workflow only after review." };
    if (error instanceof AIConfigurationError) return { error: "OpenAI analysis is not configured. Set OPENAI_API_KEY before running AI-assisted report analysis." };
    return { error: "AI analysis could not be completed safely. Nothing was saved; please try again later." };
  }

  const recommendedSeverity = inferSeverity(aiResult.analysis);
  const recommendedLikelihood = inferLikelihood(aiResult.analysis);
  const recommendedRisk = assessRisk(recommendedSeverity, recommendedLikelihood);
  const confidenceScore = confidenceToScore(aiResult.analysis.confidence_level);
  const report = await prisma.report.create({
    data: {
      title, narrative, eventDate, location, phaseOfFlight, reporterRole, tags, assignedReviewer,
      status: WorkflowStatus.HUMAN_REVIEW_REQUIRED,
      aiAnalysis: { create: { modelName: aiResult.modelName, modelVersion: "OpenAI Responses API", promptVersion: aiResult.promptVersion, summary: aiResult.analysis.summary, rationale: aiResult.analysis.explainability_note, confidenceScore, recommendedStatus: WorkflowStatus.HUMAN_REVIEW_REQUIRED, recommendedSeverity, recommendedLikelihood, recommendedRiskLevel: recommendedRisk.riskLevel, rawOutput: aiResult.rawOutput as unknown as Prisma.InputJsonValue, validatedOutput: aiResult.analysis as unknown as Prisma.InputJsonValue } },
      hazards: { create: aiResult.analysis.possible_hazards.map((hazard) => ({ category: hazard, description: "OpenAI advisory hazard classification for qualified human review.", severity: recommendedSeverity, likelihood: recommendedLikelihood, confidenceScore })) },
      governanceChecklist: { create: { deidentified: true, rationaleReviewed: false, humanDecisionRecorded: false, riskOwnerAssigned: Boolean(assignedReviewer), escalationChecked: false, limitationsAcknowledged: false, notes: "Created with AI output pending human review." } },
      auditLogs: { create: [
        { actor: "System", action: "Report created", details: "Deidentified safety report submitted for AI-assisted triage.", toStatus: WorkflowStatus.AI_DRAFT },
        { actor: "OpenAI", action: "AI advisory analysis generated", details: "Validated advisory AI output generated. Report remains human review required; no AI output can close the report or approve a risk assessment.", modelName: aiResult.modelName, promptVersion: aiResult.promptVersion, rawAiOutput: aiResult.rawOutput as unknown as Prisma.InputJsonValue, validatedAiOutput: aiResult.analysis as unknown as Prisma.InputJsonValue, aiResponseTimestamp: aiResult.timestamp, fromStatus: WorkflowStatus.AI_DRAFT, toStatus: WorkflowStatus.HUMAN_REVIEW_REQUIRED }
      ] }
    }
  });
  revalidatePath("/");
  redirect(`/reports/${report.id}`);
}

export async function updateGovernanceChecklist(reportId: string, formData: FormData) {
  await prisma.governanceChecklist.update({ where: { reportId }, data: { deidentified: checked(formData, "deidentified"), rationaleReviewed: checked(formData, "rationaleReviewed"), humanDecisionRecorded: checked(formData, "humanDecisionRecorded"), riskOwnerAssigned: checked(formData, "riskOwnerAssigned"), escalationChecked: checked(formData, "escalationChecked"), limitationsAcknowledged: checked(formData, "limitationsAcknowledged"), notes: textValue(formData, "notes") } });
  await prisma.auditLog.create({ data: { reportId, actor: textValue(formData, "actor") || "Safety Manager", action: "Governance checklist updated", details: "Checklist controls were reviewed for the AI-assisted recommendation." } });
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/governance");
}

export async function submitHumanReview(reportId: string, formData: FormData) {
  const report = await prisma.report.findUniqueOrThrow({ where: { id: reportId }, include: { riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const reviewerName = textValue(formData, "reviewerName") || "Safety Manager";
  const decision = textValue(formData, "decision") as ReviewDecision;
  const comments = textValue(formData, "comments") || "Human review completed.";
  const adjustedSeverity = textValue(formData, "severity") as Severity;
  const adjustedLikelihood = textValue(formData, "likelihood") as Likelihood;
  const adjusted = assessRisk(adjustedSeverity, adjustedLikelihood);
  const nextStatus = decisionToStatus(decision);
  await prisma.$transaction([
    prisma.humanReview.create({ data: { reportId, reviewerName, decision, comments, adjustedSeverity, adjustedLikelihood, adjustedRiskLevel: adjusted.riskLevel } }),
    prisma.riskAssessment.create({ data: { reportId, severity: adjustedSeverity, likelihood: adjustedLikelihood, riskLevel: adjusted.riskLevel, score: adjusted.score, source: "Human review", notes: comments } }),
    prisma.governanceChecklist.update({ where: { reportId }, data: { rationaleReviewed: true, humanDecisionRecorded: true, escalationChecked: decision === ReviewDecision.ESCALATED || adjusted.riskLevel !== "EXTREME", limitationsAcknowledged: true } }),
    prisma.report.update({ where: { id: reportId }, data: { status: nextStatus, assignedReviewer: reviewerName } }),
    prisma.auditLog.create({ data: { reportId, actor: reviewerName, action: `Human review ${decision.toLowerCase()}`, details: `Reviewer decision: ${decision}. Risk set to ${adjusted.riskLevel}. ${comments}`, fromStatus: report.status, toStatus: nextStatus } })
  ]);
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/review");
  revalidatePath("/evaluation");
}

function confidenceToScore(confidenceLevel: ReportAnalysis["confidence_level"]) {
  if (confidenceLevel === "high") return 0.86;
  if (confidenceLevel === "medium") return 0.68;
  return 0.44;
}

function inferSeverity(analysis: ReportAnalysis): RiskSeverity {
  const text = analysis.severity_indicators.join(" ").toLowerCase();
  if (matchesAny(text, ["catastrophic", "fatal", "fatality", "loss of aircraft"])) return "CATASTROPHIC";
  if (matchesAny(text, ["hazardous", "emergency", "near collision", "serious injury"])) return "HAZARDOUS";
  if (matchesAny(text, ["major", "damage", "injury", "unstable", "runway"])) return "MAJOR";
  if (matchesAny(text, ["moderate", "delay", "inspection", "minor injury"])) return "MODERATE";
  return "MINOR";
}

function inferLikelihood(analysis: ReportAnalysis): RiskLikelihood {
  const text = analysis.likelihood_indicators.join(" ").toLowerCase();
  if (matchesAny(text, ["frequent", "repeated", "recurring", "common"])) return "FREQUENT";
  if (matchesAny(text, ["likely", "multiple", "trend"])) return "LIKELY";
  if (matchesAny(text, ["possible", "plausible", "observed", "reported"])) return "POSSIBLE";
  if (matchesAny(text, ["unlikely", "isolated"])) return "UNLIKELY";
  return "RARE";
}

function matchesAny(value: string, terms: string[]) { return terms.some((term) => value.includes(term)); }

function decisionToStatus(decision: ReviewDecision): WorkflowStatus {
  if (decision === ReviewDecision.ACCEPTED) return WorkflowStatus.ACCEPTED;
  if (decision === ReviewDecision.MODIFIED) return WorkflowStatus.MODIFIED;
  if (decision === ReviewDecision.REJECTED) return WorkflowStatus.REJECTED;
  if (decision === ReviewDecision.ESCALATED) return WorkflowStatus.ESCALATED;
  return WorkflowStatus.CLOSED;
}
