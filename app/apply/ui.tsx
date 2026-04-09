"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function ApplyForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState("");
  const [contact, setContact] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [resources, setResources] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [whyWcn, setWhyWcn] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantName,
        contact,
        organization,
        role,
        nodeType,
        resources,
        lookingFor,
        linkedin,
        whyWcn
      })
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
      <div role="status" aria-live="polite">
        <p style={{ marginTop: 0 }}>
          <strong>Submitted.</strong>
        </p>
        <p className="muted">
          Thanks—your application is in review. If you included contact details, we’ll reach out soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="field">
        <span className="label">Name *</span>
        <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
      </label>
      <label className="field">
        <span className="label">Contact (email / Telegram / WeChat) *</span>
        <input value={contact} onChange={(e) => setContact(e.target.value)} required />
      </label>
      <label className="field">
        <span className="label">Organization</span>
        <input value={organization} onChange={(e) => setOrganization(e.target.value)} />
      </label>
      <label className="field">
        <span className="label">Role</span>
        <input value={role} onChange={(e) => setRole(e.target.value)} />
      </label>
      <label className="field">
        <span className="label">Node type</span>
        <input value={nodeType} onChange={(e) => setNodeType(e.target.value)} placeholder="Capital / Project / Media / Institutional / Talent" />
      </label>
      <label className="field">
        <span className="label">Resources you can provide</span>
        <textarea value={resources} onChange={(e) => setResources(e.target.value)} />
      </label>
      <label className="field">
        <span className="label">What you’re looking for</span>
        <textarea value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} />
      </label>
      <label className="field">
        <span className="label">LinkedIn</span>
        <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
      </label>
      <label className="field">
        <span className="label">Why WCN</span>
        <textarea value={whyWcn} onChange={(e) => setWhyWcn(e.target.value)} />
      </label>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}

