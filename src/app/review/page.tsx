import { WorkflowStatus } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { ReportTable } from "@/components/report-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const reports = await prisma.report.findMany({ where: { status: { in: [WorkflowStatus.AI_DRAFT, WorkflowStatus.HUMAN_REVIEW_REQUIRED, WorkflowStatus.ESCALATED] } }, orderBy: [{ status: "desc" }, { updatedAt: "desc" }], include: { hazards: { take: 1 }, riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return <><PageHeader title="Human Review Queue" description="Reports requiring safety manager validation before SMS decisions are accepted." /><div className="content"><div className="card"><ReportTable reports={reports} /></div></div></>;
}
