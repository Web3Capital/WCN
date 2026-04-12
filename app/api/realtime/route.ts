import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";
import { sseManager } from "@/lib/modules/realtime";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = crypto.randomUUID();
  const userId = token.id as string;
  const role = (token.role as string) ?? "USER";

  const stream = new ReadableStream({
    start(controller) {
      sseManager.add({ id: clientId, userId, role, controller });

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`));

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
        } catch {
          clearInterval(pingInterval);
          sseManager.remove(clientId);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        sseManager.remove(clientId);
      });
    },
    cancel() {
      sseManager.remove(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
