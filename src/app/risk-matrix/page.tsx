import { PageHeader } from "@/components/page-header";
import { RiskMatrix } from "@/components/risk-matrix";
import { ReportTable } from "@/components/report-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RiskMatrixPage() {
  const reports = await prisma.report.findMany({ orderBy: { updatedAt: "desc" }, include: { hazards: { take: 1 }, riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const selectedRisk = reports[0]?.riskAssessments[0];
  return <><PageHeader title="Risk Matrix" description="Severity and likelihood scoring used by the prototype SMS workflow." /><div className="content grid"><div className="card card-pad"><RiskMatrix selectedSeverity={selectedRisk?.severity} selectedLikelihood={selectedRisk?.likelihood}/></div><div className="card"><ReportTable reports={reports}/></div></div></>;
}
