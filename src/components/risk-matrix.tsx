import { Fragment } from "react";
import { assessRisk, formatEnum, likelihoodOrder, severityOrder } from "@/lib/risk";

export function RiskMatrix({
  selectedSeverity,
  selectedLikelihood
}: {
  selectedSeverity?: string;
  selectedLikelihood?: string;
}) {
  return (
    <div className="matrix" role="grid" aria-label="Severity and likelihood risk matrix">
      <div className="matrix-cell matrix-head">Severity</div>
      {likelihoodOrder.map((likelihood) => (
        <div className="matrix-cell matrix-head" key={likelihood}>
          {formatEnum(likelihood)}
        </div>
      ))}
      {severityOrder.map((severity) => (
        <Fragment key={severity}>
          <div className="matrix-cell matrix-head">{formatEnum(severity)}</div>
          {likelihoodOrder.map((likelihood) => {
            const risk = assessRisk(severity, likelihood);
            const selected = selectedSeverity === severity && selectedLikelihood === likelihood;
            return (
              <div
                className={`matrix-cell risk-${risk.riskLevel.toLowerCase()} ${selected ? "selected" : ""}`}
                key={`${severity}-${likelihood}`}
              >
                <strong>{risk.score}</strong>
                <span>{formatEnum(risk.riskLevel)}</span>
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
