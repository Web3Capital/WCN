import { ApplyForm } from "./ui";

export default function ApplyPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Apply</span>
        <h1>Apply as a node.</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Submit your node application. We typically respond within 48 hours.
        </p>

        <div className="grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>Application</h3>
            <ApplyForm />
          </div>
          <div className="card">
            <h3>What happens next</h3>
            <ul className="list-clean">
              <li>We review your submission</li>
              <li>If qualified, we schedule a call</li>
              <li>Seat, permissions, and onboarding</li>
            </ul>
            <p className="muted" style={{ marginTop: 14 }}>
              Tip: include a clear description of the resources you can provide and what you’re looking
              for.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
