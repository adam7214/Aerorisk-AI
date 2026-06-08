import Link from "next/link";
import { RiskBadge, StatusBadge } from "@/components/badges";
import { formatEnum } from "@/lib/risk";

type ReportRow = {
  id: string;
  title: string;
  location: string;
  phaseOfFlight: string;
  status: string;
  assignedReviewer: string | null;
  eventDate: Date;
  riskAssessments: { riskLevel: string; severity: string; likelihood: string }[];
  hazards: { category: string }[];
};

export function ReportTable({ reports }: { reports: ReportRow[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Report</th>
            <th>Status</th>
            <th>Hazard</th>
            <th>Risk</th>
            <th>Phase</th>
            <th>Reviewer</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const latestRisk = report.riskAssessments[0];
            return (
              <tr key={report.id}>
                <td>
                  <Link href={`/reports/${report.id}`}>
                    <strong>{report.title}</strong>
                  </Link>
                  <div className="muted">
                    {report.location} | {report.eventDate.toLocaleDateString()}
                  </div>
                </td>
                <td><StatusBadge status={report.status} /></td>
                <td>{report.hazards[0]?.category ?? "Unclassified"}</td>
                <td>
                  {latestRisk ? (
                    <>
                      <RiskBadge risk={latestRisk.riskLevel} />
                      <div className="muted">
                        {formatEnum(latestRisk.severity)} / {formatEnum(latestRisk.likelihood)}
                      </div>
                    </>
                  ) : "Pending"}
                </td>
                <td>{report.phaseOfFlight}</td>
                <td>{report.assignedReviewer ?? "Unassigned"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
