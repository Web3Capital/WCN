import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AgentRunStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const runs = await prisma.agentRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
    include: { agent: true, task: true }
  });
  return NextResponse.json({ ok: true, runs });
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

