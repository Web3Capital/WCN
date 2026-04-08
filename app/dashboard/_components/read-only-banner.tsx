export function ReadOnlyBanner() {
  return (
    <div className="card" style={{ marginBottom: 14, padding: "14px 16px" }}>
      <p className="muted" style={{ margin: 0 }}>
        <strong>Read-only.</strong> You see the same registry and ledger data as in the admin console. Editing,
        approvals, and settlement runs still require an <strong>ADMIN</strong> role.
      </p>
    </div>
  );
}
