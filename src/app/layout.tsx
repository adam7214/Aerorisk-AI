import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "AeroRisk AI", description: "Aviation safety decision-support prototype" };

const navItems = [["Dashboard","/"],["Reports","/reports"],["New Report","/reports/new"],["Review Queue","/review"],["Risk Matrix","/risk-matrix"],["Governance","/governance"],["Evaluation","/evaluation"]];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en"><body><div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">AR</div><div><div className="brand-title">AeroRisk AI</div><div className="brand-note">SMS decision support</div></div></div><nav className="nav-list" aria-label="Primary navigation">{navItems.map(([label, href]) => <Link className="nav-link" href={href} key={href}><span>{label}</span><span aria-hidden="true">&gt;</span></Link>)}</nav><div className="sidebar-footer">Decision-support prototype only. Does not certify safety or replace safety professionals.</div></aside><main className="main">{children}</main></div></body></html>
  );
}
