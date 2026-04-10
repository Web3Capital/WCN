import "@/lib/core/init";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { apiOk, apiConflict, zodToApiError } from "@/lib/core/api-response";
import { parseBody, signupSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(signupSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return apiConflict("Email already registered.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name: name ?? null, passwordHash, role: "USER" },
    select: { id: true, email: true, name: true },
  });

  await eventBus.emit(Events.USER_CREATED, {
    userId: user.id,
    email: user.email,
    role: "USER",
  });

  return apiOk(user);
}
