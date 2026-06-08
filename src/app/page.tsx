import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RiskMatrix } from "@/components/risk-matrix";
import { ReportTable } from "@/components/report-table";
import { StatusBadge } from "@/components/badges";
import { prisma } from "@/lib/prisma";
import { formatEnum } from "@/lib/risk";

export const dynamic = "force-dynamic";
const statuses = ["AI_DRAFT","HUMAN_REVIEW_REQUIRED","ACCEPTED","MODIFIED","REJECTED","ESCALATED","CLOSED"];

export default async function DashboardPage() {
  const [reports, grouped, latestAudit] = await Promise.all([
    prisma.report.findMany({ orderBy: { updatedAt: "desc" }, take: 8, include: { aiAnalysis: true, hazards: { take: 1 }, riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    prisma.report.groupBy({ by: ["status"], _count: true }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count]));
  const selectedRisk = reports[0]?.riskAssessments[0];
  return <><PageHeader title="Dashboard" description="AI-assisted aviation safety triage, human review, governance, and evaluation." action={<Link className="button primary" href="/reports/new">New Report</Link>} /><div className="content grid"><section className="grid four">{statuses.slice(0,4).map((status)=><div className="card card-pad metric" key={status}><div className="metric-label">{formatEnum(status)}</div><div className="metric-value">{counts[status]??0}</div><div className="metric-foot">Workflow status</div></div>)}</section><section className="grid two"><div className="card"><div className="card-pad section-head"><div><h2>Recent safety reports</h2><p>Deidentified narratives awaiting or completing human review.</p></div><Link className="button" href="/reports">View all</Link></div><ReportTable reports={reports}/></div><div className="grid"><div className="card card-pad"><div className="section-head"><div><h2>AI classification panel</h2><p>Advisory output for the selected report.</p></div></div>{reports[0]?.aiAnalysis ? <div className="grid"><StatusBadge status={reports[0].status}/><p className="narrative">{reports[0].aiAnalysis.summary}</p><div className="muted">{reports[0].aiAnalysis.rationale}</div></div> : <p className="muted">Seed or create a report to see AI output.</p>}</div><div className="card card-pad"><div className="section-head"><div><h2>Risk matrix</h2><p>Latest selected assessment highlighted.</p></div></div><RiskMatrix selectedSeverity={selectedRisk?.severity} selectedLikelihood={selectedRisk?.likelihood}/></div></div></section><section className="grid two"><div className="card card-pad"><div className="section-head"><div><h2>Evaluation snapshot</h2><p>Prototype metrics generated from stored workflow events.</p></div><Link className="button" href="/evaluation">Open evaluation</Link></div><div className="grid four">{statuses.slice(4).map((status)=><div className="metric" key={status}><div className="metric-label">{formatEnum(status)}</div><div className="metric-value">{counts[status]??0}</div></div>)}<div className="metric"><div className="metric-label">Total reports</div><div className="metric-value">{reports.length}</div></div></div></div><div className="card card-pad"><div className="section-head"><div><h2>Audit trail</h2><p>Recent AI recommendations and human decisions.</p></div></div><div className="timeline">{latestAudit.map((audit)=><div className="audit-item" key={audit.id}><strong>{audit.action}</strong><span>{audit.actor} | {audit.createdAt.toLocaleString()}</span><div className="muted">{audit.details}</div></div>)}</div></div></section></div></>;
}
