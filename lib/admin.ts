import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const };
  }
  return { ok: true as const, session };
}

