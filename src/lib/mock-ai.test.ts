import { describe, expect, it } from "vitest";
import { classifySafetyReport } from "@/lib/mock-ai";

describe("classifySafetyReport", () => {
  it("classifies runway incursion narratives deterministically", () => {
    const result = classifySafetyReport("Aircraft crossed after a confusing runway hold short clearance.");
    expect(result.hazards[0].category).toBe("Runway Incursion");
    expect(result.recommendedSeverity).toBe("HAZARDOUS");
    expect(result.recommendedRiskLevel).toBe("HIGH");
  });

  it("falls back to a general operational safety event", () => {
    const result = classifySafetyReport("A deidentified safety observation was submitted for triage.");
    expect(result.hazards[0].category).toBe("Operational Safety Event");
    expect(result.confidenceScore).toBe(0.82);
  });
});
