import { formatEnum } from "@/lib/risk";

export function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACCEPTED" || status === "CLOSED"
      ? "green"
      : status === "ESCALATED" || status === "REJECTED"
        ? "red"
        : status === "MODIFIED" || status === "HUMAN_REVIEW_REQUIRED"
          ? "amber"
          : "blue";

  return <span className={`badge ${color}`}>{formatEnum(status)}</span>;
}

export function RiskBadge({ risk }: { risk: string }) {
  const color = risk === "LOW" ? "green" : risk === "MEDIUM" ? "amber" : "red";
  return <span className={`badge ${color}`}>{formatEnum(risk)}</span>;
}

export function TagBadge({ label }: { label: string }) {
  return <span className="badge slate">{label}</span>;
}
