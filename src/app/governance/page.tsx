import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/badges";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const checklists = await prisma.governanceChecklist.findMany({ orderBy: { updatedAt: "desc" }, include: { report: true } });
  const completeCount = checklists.filter((item) => checklistProgress(item) === 6).length;
  return <><PageHeader title="Governance Checklist" description="Trace responsible-use controls before accepting AI-assisted safety recommendations."/><div className="content grid"><section className="grid three"><Metric label="Checklists" value={checklists.length}/><Metric label="Complete" value={completeCount}/><Metric label="Needs attention" value={checklists.length-completeCount}/></section><section className="card"><div className="table-wrap"><table><thead><tr><th>Report</th><th>Status</th><th>Progress</th><th>Updated</th></tr></thead><tbody>{checklists.map((item)=><tr key={item.id}><td><Link href={`/reports/${item.report.id}`}><strong>{item.report.title}</strong></Link><div className="muted">{item.report.location}</div></td><td><StatusBadge status={item.report.status}/></td><td>{checklistProgress(item)}/6</td><td>{item.updatedAt.toLocaleString()}</td></tr>)}</tbody></table></div></section></div></>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="card card-pad metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>}
function checklistProgress(item:{deidentified:boolean;rationaleReviewed:boolean;humanDecisionRecorded:boolean;riskOwnerAssigned:boolean;escalationChecked:boolean;limitationsAcknowledged:boolean}){return [item.deidentified,item.rationaleReviewed,item.humanDecisionRecorded,item.riskOwnerAssigned,item.escalationChecked,item.limitationsAcknowledged].filter(Boolean).length}
