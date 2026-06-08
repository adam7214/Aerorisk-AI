import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ReportTable } from "@/components/report-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({ orderBy: { updatedAt: "desc" }, include: { hazards: { take: 1 }, riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return <><PageHeader title="Reports" description="Browse deidentified safety reports and review their workflow status." action={<Link className="button primary" href="/reports/new">New Report</Link>} /><div className="content"><div className="card"><ReportTable reports={reports} /></div></div></>;
}
