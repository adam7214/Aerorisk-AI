export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="split-actions">{action}</div> : null}
    </header>
  );
}
