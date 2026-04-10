import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return apiOk([]);

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const contains = q;
  const take = 8;

  const [nodes, projects, deals, tasks, capital, agents] = await Promise.all([
    prisma.node.findMany({
      where: { OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }] },
      select: { id: true, name: true, type: true, status: true },
      take,
    }),
    prisma.project.findMany({
      where: { OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }] },
      select: { id: true, name: true, status: true },
      take,
    }),
    prisma.deal.findMany({
      where: { OR: [{ title: { contains, mode: "insensitive" } }, { id: { contains } }] },
      select: { id: true, title: true, stage: true },
      take,
    }),
    prisma.task.findMany({
      where: { OR: [{ title: { contains, mode: "insensitive" } }, { id: { contains } }] },
      select: { id: true, title: true, type: true, status: true },
      take,
    }),
    prisma.capitalProfile.findMany({
      where: { OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }] },
      select: { id: true, name: true, status: true },
      take,
    }),
    isAdmin
      ? prisma.agent.findMany({
          where: { OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }] },
          select: { id: true, name: true, type: true, status: true },
          take,
        })
      : Promise.resolve([]),
  ]);

  const results: { type: string; id: string; label: string; href: string; badge?: string }[] = [];

  for (const n of nodes) results.push({ type: "Node", id: n.id, label: n.name, href: `/dashboard/nodes/${n.id}`, badge: n.status });
  for (const p of projects) results.push({ type: "Project", id: p.id, label: p.name, href: `/dashboard/projects/${p.id}`, badge: p.status });
  for (const d of deals) results.push({ type: "Deal", id: d.id, label: d.title, href: `/dashboard/deals/${d.id}`, badge: d.stage });
  for (const t of tasks) results.push({ type: "Task", id: t.id, label: t.title, href: `/dashboard/tasks/${t.id}`, badge: t.status });
  for (const c of capital) results.push({ type: "Capital", id: c.id, label: c.name, href: `/dashboard/capital/${c.id}`, badge: c.status });
  for (const a of agents) results.push({ type: "Agent", id: a.id, label: a.name, href: `/dashboard/agents`, badge: a.status });

  return apiOk(results);
}
