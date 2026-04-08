import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

/** Any signed-in user (member console read paths). */
export async function requireSignedIn() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const };
  }
  return { ok: true as const, session };
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const };
  }
  return { ok: true as const, session };
}

