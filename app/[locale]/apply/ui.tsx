"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const NODE_TYPES = [
  "Capital Node — VC / Fund / Family Office / Angel",
  "Project Node — Protocol / DApp / Infrastructure / AI",
  "Service Node — Legal / Audit / Security / Dev / Growth",
  "Regional Node — Country / City / Local Network",
  "Media / KOL Node — Media / KOL / Community / Events",
  "Industry Node — Exchange / Market Maker / Custodian / Data",
];

const ROLES = [
  "Founder / CEO",
  "Partner / GP",
  "Managing Director",
  "VP / Director",
  "Head of BD / Partnerships",
  "Head of Research / Strategy",
  "Legal Counsel",
  "CTO / Tech Lead",
  "Marketing / Growth Lead",
  "Other",
];

const REGIONS = [
  "Asia Pacific — China / HK / Singapore / Japan / Korea / SEA",
  "Middle East — UAE / Saudi Arabia / Bahrain / Qatar",
  "Europe — UK / Germany / Switzerland / France",
  "North America — US / Canada",
  "Latin America — Brazil / Mexico / Argentina",
  "Africa — Nigeria / Kenya / South Africa",
  "CIS — Russia / Ukraine / Kazakhstan",
  "Global / Multi-region",
];

const RESOURCE_OPTIONS = [
  "Capital / Investment Capacity",
  "Deal Flow / Project Pipeline",
  "Legal / Compliance Services",
  "Audit / Security Services",
  "Technical Development",
  "Growth / Marketing / BD",
  "Media / KOL Network",
  "Regional Network / Local Relationships",
  "Research / Analysis",
  "Liquidity / Market Making",
  "Exchange Relationships",
  "Event / Conference Access",
];

const LOOKING_FOR_OPTIONS = [
  "Deal Flow / Project Access",
  "Capital / Funding",
  "Service Providers (Legal, Audit, etc.)",
  "Market Access / Distribution",
  "Regional Expansion Support",
  "Technical Partners / Dev Resources",
  "Growth / Marketing Support",
  "Media / PR Coverage",
  "Agent / AI Tooling Access",
  "Strategic Partnerships",
];

function MultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  }

  return (
    <div className="apply-multi-select">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`apply-chip${selected.includes(opt) ? " active" : ""}`}
          onClick={() => toggle(opt)}
        >
          <span className="apply-chip-check">
            {selected.includes(opt) ? "✓" : "+"}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

export function ApplyForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState("");
  const [contact, setContact] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [region, setRegion] = useState("");
  const [resources, setResources] = useState<string[]>([]);
  const [resourcesNote, setResourcesNote] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [lookingForNote, setLookingForNote] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [whyWcn, setWhyWcn] = useState("");
  const [pastCases, setPastCases] = useState("");
  const [references, setReferences] = useState("");
  const [boundaryStatement, setBoundaryStatement] = useState("");
  const [territory, setTerritory] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const resourcesFull = [
      ...resources,
      ...(resourcesNote.trim() ? [`Other: ${resourcesNote.trim()}`] : []),
    ].join("; ");

    const lookingForFull = [
      ...lookingFor,
      ...(lookingForNote.trim() ? [`Other: ${lookingForNote.trim()}`] : []),
    ].join("; ");

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantName,
        contact,
        organization,
        role,
        nodeType: nodeType + (region ? ` | Region: ${region}` : ""),
        territory: territory || null,
        resources: resourcesFull || null,
        lookingFor: lookingForFull || null,
        linkedin,
        whyWcn,
        pastCases: pastCases || null,
        references: references || null,
        boundaryStatement: boundaryStatement || null,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      setStatus("error");
      setError(json?.error ?? "Something went wrong.");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="apply-success" role="status" aria-live="polite">
        <div className="apply-success-icon">✓</div>
        <h3>Application submitted</h3>
        <p>
          Thank you for your interest in WCN. Our team will review your
          application and reach out within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form apply-form">
      <div className="apply-section-label">Basic Information</div>

      <div className="apply-row">
        <label className="field">
          <span className="label">Full Name *</span>
          <input
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            required
            placeholder="Your full name"
          />
        </label>
        <label className="field">
          <span className="label">Contact *</span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            placeholder="Email, Telegram, or WeChat"
          />
        </label>
      </div>

      <div className="apply-row">
        <label className="field">
          <span className="label">Organization</span>
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Company or fund name"
          />
        </label>
        <label className="field">
          <span className="label">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select your role...</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="apply-row">
        <label className="field">
          <span className="label">Node Type *</span>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            required
          >
            <option value="">Select node type...</option>
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Region</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Select primary region...</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="label">LinkedIn / Website</span>
        <input
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="https://linkedin.com/in/... or website URL"
        />
      </label>

      <div className="apply-divider" />
      <div className="apply-section-label">Resources & Needs</div>

      <div className="field">
        <span className="label">Resources you can provide</span>
        <span className="apply-hint">Select all that apply</span>
        <MultiSelect
          options={RESOURCE_OPTIONS}
          selected={resources}
          onChange={setResources}
        />
        <input
          value={resourcesNote}
          onChange={(e) => setResourcesNote(e.target.value)}
          placeholder="Other resources (optional)"
          className="apply-chip-extra"
        />
      </div>

      <div className="field">
        <span className="label">What you are looking for</span>
        <span className="apply-hint">Select all that apply</span>
        <MultiSelect
          options={LOOKING_FOR_OPTIONS}
          selected={lookingFor}
          onChange={setLookingFor}
        />
        <input
          value={lookingForNote}
          onChange={(e) => setLookingForNote(e.target.value)}
          placeholder="Other needs (optional)"
          className="apply-chip-extra"
        />
      </div>

      <div className="apply-divider" />
      <div className="apply-section-label">Experience & Territory</div>

      <label className="field">
        <span className="label">Territory / Region of Focus</span>
        <input
          value={territory}
          onChange={(e) => setTerritory(e.target.value)}
          placeholder="e.g. Singapore, Hong Kong, UAE, Southeast Asia"
        />
      </label>

      <label className="field">
        <span className="label">Past Cases / Track Record</span>
        <textarea
          value={pastCases}
          onChange={(e) => setPastCases(e.target.value)}
          placeholder="Describe 2-3 relevant deals, projects, or partnerships you have been involved in."
          rows={3}
        />
      </label>

      <label className="field">
        <span className="label">References</span>
        <textarea
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          placeholder="Names and contacts of 1-2 references who can vouch for your work."
          rows={2}
        />
      </label>

      <label className="field">
        <span className="label">Boundary Statement</span>
        <span className="apply-hint">What you will and will not do as a node. Helps set expectations.</span>
        <textarea
          value={boundaryStatement}
          onChange={(e) => setBoundaryStatement(e.target.value)}
          placeholder="e.g. I will focus on sourcing seed-stage DeFi projects in SEA. I will not handle legal or compliance work."
          rows={3}
        />
      </label>

      <div className="apply-divider" />

      <label className="field">
        <span className="label">Why WCN?</span>
        <textarea
          value={whyWcn}
          onChange={(e) => setWhyWcn(e.target.value)}
          placeholder="What drew you to WCN? How do you see yourself contributing to and benefiting from the network?"
          rows={4}
        />
      </label>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button apply-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
