import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { CapitalDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Capital Details", "View capital details");
export default async function CapitalDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  const profile = await prisma.capitalProfile.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      deals: {
        select: { id: true, title: true, stage: true, createdAt: true, closedAt: true },
        take: 50,
        orderBy: { createdAt: "desc" },
      },
      matches: {
        select: {
          id: true,
          score: true,
          status: true,
          createdAt: true,
          project: { select: { id: true, name: true, sector: true } },
        },
        take: 30,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) redirect("/dashboard/capital");

  const isOwner = profile.node?.ownerUserId === session.user.id;
  const data = isAdmin || isOwner
    ? profile
    : { ...profile, contactEmail: null, restrictions: null, blacklist: [] };

  const dealStageDistribution = profile.deals.reduce((acc, d) => {
    acc[d.stage] = (acc[d.stage] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const matchScoreDistribution = profile.matches.reduce((acc, m) => {
    const bucket = m.score >= 80 ? "80-100" : m.score >= 60 ? "60-79" : m.score >= 40 ? "40-59" : "0-39";
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <CapitalDetail
          profile={JSON.parse(JSON.stringify(data))}
          isAdmin={isAdmin}
          analytics={{
            dealStageDistribution,
            matchScoreDistribution,
            totalMatches: profile.matches.length,
            avgMatchScore: profile.matches.length > 0
              ? Math.round(profile.matches.reduce((s, m) => s + m.score, 0) / profile.matches.length)
              : 0,
          }}
        />
      </div>
    </div>
  );
}
