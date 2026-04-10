import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");
  if (!cycleId) {
    return apiValidationError([{ path: "cycleId", message: "cycleId query param required" }]);
  }

  const prisma = getPrisma();
  const payments = await prisma.paymentExecution.findMany({
    where: { cycleId },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    submitted: payments.filter((p) => p.status === "SUBMITTED").length,
    confirmed: payments.filter((p) => p.status === "CONFIRMED").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
  };

  return apiOk({ summary, payments });
}
