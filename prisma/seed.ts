import { PrismaClient, ReviewDecision, WorkflowStatus } from "@prisma/client";
import { classifySafetyReport } from "../src/lib/mock-ai";
import { assessRisk } from "../src/lib/risk";

const prisma = new PrismaClient();

const samples = [
  ["Runway crossing clearance ambiguity", "During taxi in low visibility, the crew received a clearance that conflicted with hold short instructions for an active runway. Ground control clarified before the aircraft crossed.", "KDEN", "Taxi", "Flight crew", ["runway", "taxi", "communication"], "Dana Kim"],
  ["Unstable approach followed by go-around", "On approach the aircraft exceeded stabilized approach criteria due to tailwind and high sink rate. The crew initiated a go-around.", "KPHX", "Approach", "Flight crew", ["approach", "go-around"], "Marco Ruiz"],
  ["Hydraulic maintenance discrepancy", "Maintenance discovered a hydraulic indication fault during post-flight inspection. The item had been deferred previously.", "KORD", "Maintenance", "Maintenance technician", ["maintenance", "hydraulic"], "Priya Shah"],
  ["Bird activity near departure runway", "A wildlife strike was suspected after departure when the crew observed bird activity near the runway environment.", "KMSP", "Takeoff", "Flight crew", ["wildlife", "bird"], "Elliot Moore"],
  ["Crew fatigue concern after extended duty", "A crew member reported fatigue after an extended duty period with limited rest opportunity.", "KSEA", "Cruise", "Flight crew", ["fatigue", "human factors"], "Nora Bell"],
  ["Moderate turbulence with late seatbelt compliance", "The flight encountered moderate turbulence during descent. The seatbelt sign was on and one minor cabin injury was reported.", "KATL", "Descent", "Cabin crew", ["turbulence", "cabin"], "Dana Kim"],
  ["Foreign object debris observed on ramp", "Ramp operations identified FOD near a gate lead-in line during aircraft parking.", "KLAX", "Ramp", "Ramp operations", ["fod", "ramp"], "Marco Ruiz"],
  ["Readback correction during frequency congestion", "During frequency congestion, a clearance readback was corrected by ATC after another aircraft used a similar call sign.", "KJFK", "Climb", "Dispatcher", ["communication", "readback"], "Priya Shah"]
] as const;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.humanReview.deleteMany();
  await prisma.governanceChecklist.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.hazard.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.report.deleteMany();

  for (const [index, sample] of samples.entries()) {
    const [title, narrative, location, phaseOfFlight, reporterRole, tags, assignedReviewer] = sample;
    const mock = classifySafetyReport(narrative);
    const risk = assessRisk(mock.recommendedSeverity, mock.recommendedLikelihood);
    const reviewed = index % 3 !== 0;
    const decision = index === 2 ? ReviewDecision.MODIFIED : index === 4 ? ReviewDecision.ESCALATED : ReviewDecision.ACCEPTED;
    const status = reviewed ? decisionToStatus(decision) : WorkflowStatus.HUMAN_REVIEW_REQUIRED;
    await prisma.report.create({ data: { title, narrative, eventDate: new Date(2026, index, 8), location, phaseOfFlight, reporterRole, tags: [...tags], assignedReviewer, status, aiAnalysis: { create: { modelName: "AeroRisk Mock Classifier", modelVersion: "0.1.0-deterministic", promptVersion: "mock-keyword-v1", summary: mock.summary, rationale: mock.rationale, confidenceScore: mock.confidenceScore, recommendedStatus: WorkflowStatus.HUMAN_REVIEW_REQUIRED, recommendedSeverity: mock.recommendedSeverity, recommendedLikelihood: mock.recommendedLikelihood, recommendedRiskLevel: mock.recommendedRiskLevel } }, hazards: { create: mock.hazards }, riskAssessments: { create: { severity: mock.recommendedSeverity, likelihood: mock.recommendedLikelihood, riskLevel: risk.riskLevel, score: risk.score, source: "AI recommendation", notes: "Seeded mock recommendation." } }, governanceChecklist: { create: { deidentified: true, rationaleReviewed: reviewed, humanDecisionRecorded: reviewed, riskOwnerAssigned: true, escalationChecked: reviewed, limitationsAcknowledged: reviewed, notes: reviewed ? "Seeded review completed for demonstration." : "Pending human review." } }, humanReviews: reviewed ? { create: { reviewerName: assignedReviewer, decision, comments: "Seeded reviewer decision for prototype metrics.", adjustedSeverity: mock.recommendedSeverity, adjustedLikelihood: mock.recommendedLikelihood, adjustedRiskLevel: risk.riskLevel } } : undefined, auditLogs: { create: [{ actor: "System", action: "Report created", details: "Seeded deidentified safety report created.", toStatus: WorkflowStatus.AI_DRAFT }, { actor: "Mock AI", action: "AI recommendation generated", details: `${mock.summary} Recommended ${mock.recommendedRiskLevel} risk.`, fromStatus: WorkflowStatus.AI_DRAFT, toStatus: WorkflowStatus.HUMAN_REVIEW_REQUIRED }] } } });
  }
}

function decisionToStatus(decision: ReviewDecision): WorkflowStatus {
  if (decision === ReviewDecision.ACCEPTED) return WorkflowStatus.ACCEPTED;
  if (decision === ReviewDecision.MODIFIED) return WorkflowStatus.MODIFIED;
  if (decision === ReviewDecision.REJECTED) return WorkflowStatus.REJECTED;
  if (decision === ReviewDecision.ESCALATED) return WorkflowStatus.ESCALATED;
  return WorkflowStatus.CLOSED;
}

main().then(async () => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
