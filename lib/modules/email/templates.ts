/**
 * @wcn/email — HTML Email Templates
 *
 * Minimal, inline-styled templates for maximum compatibility.
 */

const BRAND_COLOR = "#6366f1";
const BG = "#f8fafc";
const TEXT = "#1e293b";
const MUTED = "#64748b";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://wcn.network";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
  <tr><td style="background:${BRAND_COLOR};padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">WCN</h1>
  </td></tr>
  <tr><td style="padding:32px;color:${TEXT};font-size:15px;line-height:1.6;">
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT};">${title}</h2>
    ${body}
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;color:${MUTED};font-size:12px;">
    World Capital Network &middot; <a href="${BASE_URL}" style="color:${BRAND_COLOR};">wcn.network</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:12px 24px;">
<a href="${url}" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px;">${text}</a>
</td></tr></table>`;
}

// ─── Template Functions ──────────────────────────────────────────

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to WCN",
    html: layout("Welcome to WCN", `
      <p>Hi ${name},</p>
      <p>Your account has been created. WCN connects capital with opportunity through a decentralized network of verified nodes.</p>
      ${button("Go to Dashboard", `${BASE_URL}/dashboard`)}
      <p style="color:${MUTED};">If you didn't create this account, you can safely ignore this email.</p>
    `),
    text: `Welcome to WCN, ${name}! Go to ${BASE_URL}/dashboard to get started.`,
  };
}

export function newMatchEmail(recipientName: string, projectName: string, score: number, matchId: string) {
  return {
    subject: `New Match: ${projectName} (Score: ${score})`,
    html: layout("New Match Found", `
      <p>Hi ${recipientName},</p>
      <p>A new match has been generated for you:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;border-radius:4px 0 0 0;">Project</td><td style="padding:8px 12px;background:#f1f5f9;border-radius:0 4px 0 0;">${projectName}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;">Score</td><td style="padding:8px 12px;">${score}/100</td></tr>
      </table>
      ${button("View Match", `${BASE_URL}/dashboard/matches`)}
    `),
    text: `New match for "${projectName}" with score ${score}. View at ${BASE_URL}/dashboard/matches`,
  };
}

export function dealStageEmail(recipientName: string, dealTitle: string, newStage: string, dealId: string) {
  return {
    subject: `Deal Update: ${dealTitle} → ${newStage}`,
    html: layout("Deal Stage Update", `
      <p>Hi ${recipientName},</p>
      <p>The deal <strong>${dealTitle}</strong> has moved to stage <strong>${newStage}</strong>.</p>
      ${button("View Deal", `${BASE_URL}/dashboard/deals/${dealId}`)}
    `),
    text: `Deal "${dealTitle}" moved to ${newStage}. View at ${BASE_URL}/dashboard/deals/${dealId}`,
  };
}

export function settlementEmail(recipientName: string, amount: number, cycleId: string) {
  return {
    subject: `Settlement Distribution: $${amount.toLocaleString()}`,
    html: layout("Settlement Distributed", `
      <p>Hi ${recipientName},</p>
      <p>A settlement has been distributed. Your allocation:</p>
      <p style="font-size:28px;font-weight:700;color:${BRAND_COLOR};margin:16px 0;">$${amount.toLocaleString()}</p>
      ${button("View Settlement", `${BASE_URL}/dashboard/settlement`)}
    `),
    text: `Settlement distributed. Your allocation: $${amount.toLocaleString()}. View at ${BASE_URL}/dashboard/settlement`,
  };
}

export function riskAlertEmail(severity: string, entityType: string, entityId: string, reason: string) {
  const color = severity === "HIGH" || severity === "CRITICAL" ? "#ef4444" : "#f59e0b";
  return {
    subject: `[${severity}] Risk Alert: ${entityType}`,
    html: layout("Risk Alert", `
      <div style="padding:12px 16px;background:${color}15;border-left:4px solid ${color};border-radius:4px;margin-bottom:16px;">
        <p style="margin:0;font-weight:600;color:${color};">Severity: ${severity}</p>
      </div>
      <p><strong>Entity:</strong> ${entityType} / ${entityId}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      ${button("Review in Dashboard", `${BASE_URL}/dashboard/risk`)}
    `),
    text: `Risk alert [${severity}] for ${entityType}/${entityId}: ${reason}`,
  };
}

export function applicationSubmittedEmail(applicantName: string, applicationId: string) {
  return {
    subject: `New Application: ${applicantName}`,
    html: layout("New Node Application", `
      <p>A new node application has been submitted by <strong>${applicantName}</strong>.</p>
      ${button("Review Application", `${BASE_URL}/dashboard/applications`)}
    `),
    text: `New node application from ${applicantName}. Review at ${BASE_URL}/dashboard/applications`,
  };
}

export function evidenceApprovedEmail(recipientName: string, evidenceTitle: string, dealId: string) {
  return {
    subject: `Evidence Approved: ${evidenceTitle}`,
    html: layout("Evidence Approved", `
      <p>Hi ${recipientName},</p>
      <p>The evidence <strong>${evidenceTitle}</strong> has been approved. PoB attribution is now pending calculation.</p>
      ${button("View Deal", `${BASE_URL}/dashboard/deals/${dealId}`)}
    `),
    text: `Evidence "${evidenceTitle}" approved. View at ${BASE_URL}/dashboard/deals/${dealId}`,
  };
}

export function pobCreatedEmail(recipientName: string, pobId: string, percentage: number) {
  return {
    subject: "New PoB Attribution",
    html: layout("Proof of Business Created", `
      <p>Hi ${recipientName},</p>
      <p>A new Proof of Business record has been created with your node as an attributed participant.</p>
      <p style="font-size:22px;font-weight:700;color:${BRAND_COLOR};margin:16px 0;">${percentage}% attribution</p>
      ${button("View PoB", `${BASE_URL}/dashboard/pob`)}
    `),
    text: `New PoB record created. You have ${percentage}% attribution. View at ${BASE_URL}/dashboard/pob`,
  };
}
