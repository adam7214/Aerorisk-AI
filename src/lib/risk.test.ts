import { describe, expect, it } from "vitest";
import { assessRisk, riskScore } from "@/lib/risk";

describe("risk matrix", () => {
  it("scores severity x likelihood", () => {
    expect(riskScore("HAZARDOUS", "POSSIBLE")).toBe(12);
  });

  it("maps high scores to the expected level", () => {
    expect(assessRisk("CATASTROPHIC", "FREQUENT")).toEqual({ score: 25, riskLevel: "EXTREME" });
  });
});
