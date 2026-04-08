export default function ApplyPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Apply</span>
        <h1>Apply as a node.</h1>
        <div className="grid-2">
          <div className="card">
            <h3>Recommended fields</h3>
            <ul className="list-clean">
              <li>Name</li>
              <li>Organization</li>
              <li>Role</li>
              <li>Node Type</li>
              <li>Resources You Can Provide</li>
              <li>What You Are Looking For</li>
              <li>LinkedIn / Contact</li>
              <li>Why WCN</li>
            </ul>
          </div>
          <div className="card">
            <h3>Quick launch suggestion</h3>
            <p>
              Start with a Tally, Typeform, or Google Form here. Later, replace this section with a
              custom application flow connected to your CRM.
            </p>
            <p className="muted">
              Example CTA buttons: Apply as Capital Node / Apply as Project Node / Schedule a Private Call
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
