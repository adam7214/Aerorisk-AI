import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const REPORT_ANALYSIS_PROMPT_VERSION = "aerorisk-report-analysis-v1";
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

const reportAnalysisResponseSchema = z
  .object({
    summary: z.string().min(1),
    possible_hazards: z.array(z.string().min(1)).min(1),
    contributing_factors: z.array(z.string().min(1)),
    sms_category: z.string().min(1),
    severity_indicators: z.array(z.string().min(1)),
    likelihood_indicators: z.array(z.string().min(1)),
    recommended_safety_questions: z.array(z.string().min(1)).min(1),
    confidence_level: z.enum(["low", "medium", "high"]),
    explainability_note: z.string().min(1),
    human_review_required: z.boolean()
  })
  .strict();

export const reportAnalysisSchema = reportAnalysisResponseSchema.refine(
  (value) => value.human_review_required === true,
  "AI analysis must require human review."
);

export type ReportAnalysis = z.infer<typeof reportAnalysisResponseSchema>;

export type ClassifiedReport = {
  analysis: ReportAnalysis;
  rawOutput: unknown;
  modelName: string;
  promptVersion: string;
  timestamp: Date;
};

export class InvalidAIResponseError extends Error {
  constructor() {
    super("AI response failed validation.");
    this.name = "InvalidAIResponseError";
  }
}

export class AIConfigurationError extends Error {
  constructor() {
    super("OpenAI API key is not configured.");
    this.name = "AIConfigurationError";
  }
}

export async function classifyReport(narrative: string): Promise<ReportAnalysis> {
  const result = await classifyReportWithMetadata(narrative);
  return result.analysis;
}

export async function classifyReportWithMetadata(narrative: string): Promise<ClassifiedReport> {
  if (!process.env.OPENAI_API_KEY) {
    throw new AIConfigurationError();
  }

  const modelName = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.parse({
    model: modelName,
    input: [
      {
        role: "system",
        content: [
          "You are AeroRisk AI, an aviation safety management decision-support assistant.",
          "Analyze only deidentified aviation safety narratives.",
          "Return advisory hazard-identification support for qualified human review.",
          "Do not certify safety, approve risk assessments, close reports, or make operational decisions.",
          "Always set human_review_required to true."
        ].join(" ")
      },
      {
        role: "user",
        content: `Prompt version: ${REPORT_ANALYSIS_PROMPT_VERSION}\n\nDeidentified aviation safety narrative:\n${narrative}`
      }
    ],
    text: {
      format: zodTextFormat(reportAnalysisResponseSchema, "aerorisk_report_analysis")
    }
  });

  const parsed = response.output_parsed;
  const validated = reportAnalysisSchema.safeParse(parsed);

  if (!validated.success) {
    throw new InvalidAIResponseError();
  }

  return {
    analysis: validated.data,
    rawOutput: response.output_text ? safeJsonParse(response.output_text) : parsed,
    modelName,
    promptVersion: REPORT_ANALYSIS_PROMPT_VERSION,
    timestamp: new Date()
  };
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
