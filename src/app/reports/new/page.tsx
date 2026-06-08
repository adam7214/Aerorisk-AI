import { PageHeader } from "@/components/page-header";
import { NewReportForm } from "@/components/new-report-form";

export default function NewReportPage() {
  return <><PageHeader title="New Report" description="Enter a deidentified aviation safety narrative for mock-first or OpenAI-assisted advisory analysis." /><div className="content"><NewReportForm /></div></>;
}
