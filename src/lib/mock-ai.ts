import { assessRisk, type Likelihood, type RiskLevel, type Severity } from "@/lib/risk";

type HazardRule = {
  category: string;
  keywords: string[];
  description: string;
  severity: Severity;
  likelihood: Likelihood;
};

const hazardRules: HazardRule[] = [
  { category: "Runway Incursion", keywords: ["runway", "hold short", "incursion", "crossed"], description: "Potential surface movement conflict requiring runway safety review.", severity: "HAZARDOUS", likelihood: "POSSIBLE" },
  { category: "Unstable Approach", keywords: ["unstable", "approach", "go-around", "sink rate"], description: "Approach stability parameters may have exceeded SMS thresholds.", severity: "MAJOR", likelihood: "LIKELY" },
  { category: "Maintenance Discrepancy", keywords: ["maintenance", "deferred", "fault", "inspection", "hydraulic"], description: "Aircraft technical condition or maintenance process requires follow-up.", severity: "MAJOR", likelihood: "POSSIBLE" },
  { category: "Wildlife Strike", keywords: ["bird", "wildlife", "strike"], description: "Wildlife exposure could increase damage or operational interruption risk.", severity: "MODERATE", likelihood: "POSSIBLE" },
  { category: "Fatigue", keywords: ["fatigue", "tired", "rest", "duty"], description: "Crew fatigue indicators require human factors review.", severity: "MAJOR", likelihood: "POSSIBLE" },
  { category: "Turbulence", keywords: ["turbulence", "seatbelt", "cabin injury"], description: "Turbulence encounter may require cabin safety and forecasting review.", severity: "MODERATE", likelihood: "LIKELY" },
  { category: "Foreign Object Debris", keywords: ["fod", "debris", "foreign object"], description: "Foreign object debris was observed or suspected in an operational area.", severity: "MODERATE", likelihood: "POSSIBLE" },
  { category: "Communication Breakdown", keywords: ["communication", "readback", "clearance", "frequency"], description: "Radio, readback, or coordination issue may have affected shared situational awareness.", severity: "MAJOR", likelihood: "POSSIBLE" }
];

export type MockHazard = {
  category: string;
  description: string;
  severity: Severity;
  likelihood: Likelihood;
  confidenceScore: number;
};

export type MockAIResult = {
  summary: string;
  rationale: string;
  confidenceScore: number;
  recommendedSeverity: Severity;
  recommendedLikelihood: Likelihood;
  recommendedRiskLevel: RiskLevel;
  hazards: MockHazard[];
};

export function classifySafetyReport(narrative: string): MockAIResult {
  const normalized = narrative.toLowerCase();
  const matched = hazardRules.filter((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  const hazards = (matched.length ? matched : [fallbackRule]).map((rule, index) => ({
    category: rule.category,
    description: rule.description,
    severity: rule.severity,
    likelihood: rule.likelihood,
    confidenceScore: Number((0.82 - index * 0.06).toFixed(2))
  }));
  const topHazard = hazards.reduce((current, next) => {
    const currentRisk = assessRisk(current.severity, current.likelihood).score;
    const nextRisk = assessRisk(next.severity, next.likelihood).score;
    return nextRisk > currentRisk ? next : current;
  });
  const assessment = assessRisk(topHazard.severity, topHazard.likelihood);

  return {
    summary: `Mock classifier identified ${hazards.map((hazard) => hazard.category).join(", ")} as the primary hazard signal.`,
    rationale: "Deterministic placeholder output based on keyword matching. Human safety review is required before any SMS decision is accepted.",
    confidenceScore: hazards[0]?.confidenceScore ?? 0.72,
    recommendedSeverity: topHazard.severity,
    recommendedLikelihood: topHazard.likelihood,
    recommendedRiskLevel: assessment.riskLevel,
    hazards
  };
}

const fallbackRule: HazardRule = {
  category: "Operational Safety Event",
  keywords: [],
  description: "General operational safety report requiring triage by a safety manager.",
  severity: "MODERATE",
  likelihood: "POSSIBLE"
};
