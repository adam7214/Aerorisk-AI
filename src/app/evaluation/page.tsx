import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { formatEnum } from "@/lib/risk";

export const dynamic = "force-dynamic";

export default async function EvaluationPage() {
  const [reports, reviews, hazards, grouped] = await Promise.all([prisma.report.findMany({ include: { humanReviews: true } }), prisma.humanReview.findMany(), prisma.hazard.groupBy({ by: ["category"], _count: true }), prisma.report.groupBy({ by: ["status"], _count: true })]);
  const accepted = reviews.filter((review) => review.decision === "ACCEPTED").length;
  const modified = reviews.filter((review) => review.decision === "MODIFIED").length;
  const rejected = reviews.filter((review) => review.decision === "REJECTED").length;
  const escalated = reviews.filter((review) => review.decision === "ESCALATED").length;
  const agreementRate = reviews.length ? Math.round((accepted / reviews.length) * 100) : 0;
  const escalationRate = reviews.length ? Math.round((escalated / reviews.length) * 100) : 0;
  const modificationRate = reviews.length ? Math.round(((modified + rejected) / reviews.length) * 100) : 0;
  return <><PageHeader title="Evaluation" description="Prototype metrics for classifier usefulness, review agreement, escalation, and throughput."/><div className="content grid"><section className="grid four"><Metric label="Reviewer agreement" value={`${agreementRate}%`} foot="Accepted AI recommendation"/><Metric label="Modified / rejected" value={`${modificationRate}%`} foot="Human decision differed"/><Metric label="Escalation rate" value={`${escalationRate}%`} foot="Reviews escalated"/><Metric label="Total reports" value={`${reports.length}`} foot="Stored reports"/></section><section className="grid two"><Panel title="Status distribution" items={grouped.map((item)=>[formatEnum(item.status),`${item._count} report(s)`])}/><Panel title="Hazard category distribution" items={hazards.map((hazard)=>[hazard.category,`${hazard._count} report(s)`])}/></section><section className="card card-pad"><div className="section-head"><div><h2>Interpretation guardrail</h2><p>Metrics are for prototype evaluation only. They do not validate operational safety performance, certify hazards, or establish model fitness for deployment.</p></div></div></section></div></>;
}
function Metric({label,value,foot}:{label:string;value:string;foot:string}){return <div className="card card-pad metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div></div>}
function Panel({title,items}:{title:string;items:string[][]}){return <div className="card card-pad"><div className="section-head"><div><h2>{title}</h2></div></div><div className="timeline">{items.map(([label,value])=><div className="audit-item" key={label}><strong>{label}</strong><span>{value}</span></div>)}</div></div>}
