import { describe, expect, it } from "vitest";
import { reportAnalysisSchema } from "@/lib/ai/classifyReport";

const validAnalysis = {
  summary: "Advisory summary of a deidentified runway event.",
  possible_hazards: ["Runway incursion"],
  contributing_factors: ["Low visibility", "Clearance ambiguity"],
  sms_category: "Runway safety",
  severity_indicators: ["Potential runway conflict"],
  likelihood_indicators: ["Reported operational exposure"],
  recommended_safety_questions: ["What runway safety barriers were active?"],
  confidence_level: "medium",
  explainability_note: "Based on the runway and clearance language in the narrative.",
  human_review_required: true
};

describe("reportAnalysisSchema", () => {
  it("accepts the required structured AI report shape", () => {
    expect(reportAnalysisSchema.safeParse(validAnalysis).success).toBe(true);
  });

  it("rejects output that does not require human review", () => {
    expect(reportAnalysisSchema.safeParse({ ...validAnalysis, human_review_required: false }).success).toBe(false);
  });
});
