import { describe, it, expect, vi } from "vitest";
import { writeOutbox } from "@/lib/core/outbox/write";
import { Events } from "@/lib/core/event-types";
import type { OutboxTx } from "@/lib/core/outbox/write";

function makeTx(createImpl?: (args: { data: Record<string, unknown>; select: unknown }) => Promise<{ id: string }>): OutboxTx {
  const create =
    createImpl ?? (async () => ({ id: "outbox_test_id" }));
  return { outbox: { create: vi.fn(create) } } as unknown as OutboxTx;
}

describe("writeOutbox", () => {
  it("inserts an outbox row with the event name and payload as JSON", async () => {
    const tx = makeTx();
    const payload = { pobId: "pob_1", dealId: "deal_1", attributions: [], totalValue: 42 };

    const result = await writeOutbox(tx, Events.POB_CREATED, payload);

    expect(result.id).toBe("outbox_test_id");
    const create = (tx as unknown as { outbox: { create: ReturnType<typeof vi.fn> } }).outbox.create;
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        eventName: "pob.created",
        payload,
        actorId: null,
        requestId: null,
      },
      select: { id: true },
    });
  });

  it("threads actorId and requestId through meta", async () => {
    const tx = makeTx();
    await writeOutbox(
      tx,
      Events.POB_CREATED,
      { pobId: "pob_1", attributions: [] },
      { actorId: "user_42", requestId: "req_abc" },
    );
    const create = (tx as unknown as { outbox: { create: ReturnType<typeof vi.fn> } }).outbox.create;
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorId: "user_42", requestId: "req_abc" }),
      }),
    );
  });

  it("defaults actorId and requestId to null when meta is omitted", async () => {
    const tx = makeTx();
    await writeOutbox(tx, Events.POB_FLAGGED, { pobId: "pob_1", reason: "stale", flaggedBy: "user_x" });
    const create = (tx as unknown as { outbox: { create: ReturnType<typeof vi.fn> } }).outbox.create;
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorId: null, requestId: null }),
      }),
    );
  });

  it("normalises undefined meta fields to null (Prisma rejects undefined for nullable scalars in some adapters)", async () => {
    const tx = makeTx();
    await writeOutbox(
      tx,
      Events.POB_CREATED,
      { pobId: "pob_1", attributions: [] },
      { actorId: undefined, requestId: undefined },
    );
    const create = (tx as unknown as { outbox: { create: ReturnType<typeof vi.fn> } }).outbox.create;
    const call = create.mock.calls[0][0] as { data: { actorId: unknown; requestId: unknown } };
    expect(call.data.actorId).toBeNull();
    expect(call.data.requestId).toBeNull();
  });

  it("propagates errors from the transaction client (so the outer $transaction rolls back)", async () => {
    const boom = new Error("simulated db failure");
    const tx = makeTx(async () => {
      throw boom;
    });
    await expect(
      writeOutbox(tx, Events.POB_CREATED, { pobId: "pob_1", attributions: [] }),
    ).rejects.toBe(boom);
  });

  it("accepts the string-fallback overload for ad-hoc events not in EventMap", async () => {
    const tx = makeTx();
    await writeOutbox(tx, "experimental.event", { foo: "bar" }, { actorId: "user_z" });
    const create = (tx as unknown as { outbox: { create: ReturnType<typeof vi.fn> } }).outbox.create;
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventName: "experimental.event", payload: { foo: "bar" } }),
      }),
    );
  });
});
