import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AgentRunStatus } from "@prisma/client";
import { getOwnedNodeIds, memberAgentRunsWhere } from "@/lib/member-data-scope";
import { redactAgentForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const where = isAdmin ? {} : memberAgentRunsWhere(await getOwnedNodeIds(prisma, userId));

  const runs = await prisma.agentRun.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: 200,
    include: { agent: true, task: true }
  });

  return NextResponse.json({
    ok: true,
    runs: isAdmin ? runs : runs.map((r) => ({ ...r, agent: r.agent ? redactAgentForMember(r.agent) : r.agent }))
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const agentId = String(body?.agentId ?? "").trim();
  if (!agentId) return NextResponse.json({ ok: false, error: "Missing agentId." }, { status: 400 });

  const run = await prisma.agentRun.create({
    data: {
      agentId,
      taskId: body?.taskId ? String(body.taskId) : null,
      status: body?.status ? (String(body.status) as AgentRunStatus) : undefined,
      inputs: body?.inputs ?? null,
      outputs: body?.outputs ?? null,
      cost: body?.cost !== undefined ? Number(body.cost) : null,
      finishedAt: body?.finishedAt ? new Date(String(body.finishedAt)) : null
    },
    include: { agent: true, task: true }
  });
  return NextResponse.json({ ok: true, run });
}

