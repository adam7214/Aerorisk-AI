export const severityOrder = ["MINOR", "MODERATE", "MAJOR", "HAZARDOUS", "CATASTROPHIC"] as const;
export const likelihoodOrder = ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "FREQUENT"] as const;

export type Severity = (typeof severityOrder)[number];
export type Likelihood = (typeof likelihoodOrder)[number];
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export function riskScore(severity: Severity, likelihood: Likelihood) {
  return (severityOrder.indexOf(severity) + 1) * (likelihoodOrder.indexOf(likelihood) + 1);
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 20) return "EXTREME";
  if (score >= 12) return "HIGH";
  if (score >= 6) return "MEDIUM";
  return "LOW";
}

export function assessRisk(severity: Severity, likelihood: Likelihood) {
  const score = riskScore(severity, likelihood);
  return { score, riskLevel: riskLevel(score) };
}

export function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
