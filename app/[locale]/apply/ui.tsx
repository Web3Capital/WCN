"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type Status = "idle" | "submitting" | "success" | "error";
type Receipt = { referenceId: string; filedDate: string };

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
          aria-pressed={selected.includes(opt)}
        >
          <span className="apply-chip-check" aria-hidden>
            {selected.includes(opt) ? "✓" : "+"}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}

/** Required marker — small mono microtype, never breaks the label flow */
function Required() {
  const t = useTranslations("apply");
  return <span className="apply-required-hint" aria-hidden> · {t("requiredHint")}</span>;
}

export function ApplyForm() {
  const t = useTranslations("apply");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

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

    const filedAt = new Date();
    const referenceId = `APP-${filedAt.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setReceipt({
      referenceId,
      filedDate: filedAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
    });
    setStatus("success");
  }

  if (status === "success") {
    const receiptData = receipt ?? { referenceId: "APP-PENDING", filedDate: "" };
    return (
      <div className="apply-success" role="status" aria-live="polite">
        <div className="apply-receipt">
          <div className="apply-receipt-header">
            <span className="apply-receipt-label">{t("successReceiptLabel")}</span>
            <span className="apply-receipt-id">{receiptData.referenceId}</span>
          </div>
          <h3 className="apply-success-title">{t("successTitle")}</h3>
          <p className="apply-success-body">{t("successBody")}</p>
          <div className="apply-receipt-meta">
            <div>
              <span className="apply-receipt-meta-label">Status</span>
              <span className="apply-receipt-meta-value apply-receipt-meta-value-pending">
                {t("successReceiptStatus")}
              </span>
            </div>
            <div>
              <span className="apply-receipt-meta-label">Filed</span>
              <span className="apply-receipt-meta-value">
                {receiptData.filedDate}
              </span>
            </div>
          </div>
        </div>
        <div className="apply-success-continue">
          <span className="apply-success-continue-label">{t("successContinueLabel")}</span>
          <div className="apply-success-continue-actions">
            <Link href="/wiki" className="button-secondary">{t("successContinueRead")}</Link>
            <Link href="/nodes" className="button-secondary">{t("successContinueExplore")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form apply-form">
      <div className="apply-section-label">{t("sectionBasic")}</div>

      <div className="apply-row">
        <label className="field">
          <span className="label">
            {t("fieldFullName")}<Required />
          </span>
          <input
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            required
            placeholder={t("fieldFullNamePh")}
          />
        </label>
        <label className="field">
          <span className="label">
            {t("fieldContact")}<Required />
          </span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            placeholder={t("fieldContactPh")}
          />
        </label>
      </div>

      <div className="apply-row">
        <label className="field">
          <span className="label">{t("fieldOrganization")}</span>
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={t("fieldOrganizationPh")}
          />
        </label>
        <label className="field">
          <span className="label">{t("fieldRole")}</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">{t("fieldRolePh")}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="apply-row">
        <label className="field">
          <span className="label">
            {t("fieldNodeType")}<Required />
          </span>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            required
          >
            <option value="">{t("fieldNodeTypePh")}</option>
            {NODE_TYPES.map((nt) => (
              <option key={nt} value={nt}>{nt}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">{t("fieldRegion")}</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t("fieldRegionPh")}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="label">{t("fieldLinkedin")}</span>
        <input
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder={t("fieldLinkedinPh")}
        />
      </label>

      <div className="apply-divider" />
      <div className="apply-section-label">{t("sectionResources")}</div>

      <div className="field">
        <span className="label">{t("fieldResources")}</span>
        <span className="apply-hint">{t("selectAllThatApply")}</span>
        <MultiSelect
          options={RESOURCE_OPTIONS}
          selected={resources}
          onChange={setResources}
        />
        <input
          value={resourcesNote}
          onChange={(e) => setResourcesNote(e.target.value)}
          placeholder={t("fieldResourcesOther")}
          className="apply-chip-extra"
        />
      </div>

      <div className="field">
        <span className="label">{t("fieldLookingFor")}</span>
        <span className="apply-hint">{t("selectAllThatApply")}</span>
        <MultiSelect
          options={LOOKING_FOR_OPTIONS}
          selected={lookingFor}
          onChange={setLookingFor}
        />
        <input
          value={lookingForNote}
          onChange={(e) => setLookingForNote(e.target.value)}
          placeholder={t("fieldLookingForOther")}
          className="apply-chip-extra"
        />
      </div>

      <div className="apply-divider" />
      <div className="apply-section-label">{t("sectionExperience")}</div>

      <label className="field">
        <span className="label">{t("fieldTerritory")}</span>
        <input
          value={territory}
          onChange={(e) => setTerritory(e.target.value)}
          placeholder={t("fieldTerritoryPh")}
        />
      </label>

      <label className="field">
        <span className="label">{t("fieldPastCases")}</span>
        <textarea
          value={pastCases}
          onChange={(e) => setPastCases(e.target.value)}
          placeholder={t("fieldPastCasesPh")}
          rows={3}
        />
      </label>

      <label className="field">
        <span className="label">{t("fieldReferences")}</span>
        <textarea
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          placeholder={t("fieldReferencesPh")}
          rows={2}
        />
      </label>

      <label className="field">
        <span className="label">{t("fieldBoundary")}</span>
        <span className="apply-hint">{t("fieldBoundaryHint")}</span>
        <textarea
          value={boundaryStatement}
          onChange={(e) => setBoundaryStatement(e.target.value)}
          placeholder={t("fieldBoundaryPh")}
          rows={3}
        />
      </label>

      <div className="apply-divider" />
      <div className="apply-section-label">{t("sectionMotivation")}</div>

      <label className="field">
        <span className="label">{t("fieldWhy")}</span>
        <textarea
          value={whyWcn}
          onChange={(e) => setWhyWcn(e.target.value)}
          placeholder={t("fieldWhyPh")}
          rows={4}
        />
      </label>

      {error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : null}
      <button className="button apply-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
