export function ReadOnlyBanner() {
  return (
    <div className="card" style={{ marginBottom: 14, padding: "14px 16px" }}>
      <p className="muted" style={{ margin: 0 }}>
        <strong>Read-only.</strong> Data is scoped to your nodes. Contact details are hidden unless the project belongs
        to your node. Editing, approvals, and settlement runs require an <strong>ADMIN</strong> role.
      </p>
    </div>
  );
}
