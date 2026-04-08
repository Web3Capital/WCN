"use client";

import { useState } from "react";
import Link from "next/link";

type SeatRow = { id: string; level: number; status: string; createdAt: string | Date };
type StakeRow = { id: string; action: string; amount: number; notes: string | null; createdAt: string | Date };
type PenaltyRow = { id: string; type: string; reason: string; amount: number | null; createdAt: string | Date };

export function NodeGovernance({
  nodeId,
  initialSeats,
  initialStake,
  initialPenalties,
  readOnly = false
}: {
  nodeId: string;
  initialSeats: SeatRow[];
  initialStake: StakeRow[];
  initialPenalties: PenaltyRow[];
  readOnly?: boolean;
}) {
  const [seats, setSeats] = useState<SeatRow[]>(initialSeats);
  const [stake, setStake] = useState<StakeRow[]>(initialStake);
  const [penalties, setPenalties] = useState<PenaltyRow[]>(initialPenalties);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newSeat, setNewSeat] = useState({ level: "1", status: "ACTIVE" });
  const [newStake, setNewStake] = useState({ action: "DEPOSIT", amount: "", notes: "" });
  const [newPenalty, setNewPenalty] = useState({ type: "FREEZE", reason: "", amount: "" });

  async function refreshSeats() {
    const res = await fetch(`/api/nodes/${nodeId}/seats`, { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setSeats(data.seats);
  }

  async function refreshStake() {
    const res = await fetch(`/api/nodes/${nodeId}/stake`, { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setStake(data.entries);
  }

  async function refreshPenalties() {
    const res = await fetch(`/api/nodes/${nodeId}/penalties`, { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setPenalties(data.penalties);
  }

  async function addSeat() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/nodes/${nodeId}/seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: Number(newSeat.level), status: newSeat.status })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Failed.");
      setNewSeat({ level: "1", status: "ACTIVE" });
      await refreshSeats();
    } catch (e: any) {
      setError(e?.message ?? "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addStake() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/nodes/${nodeId}/stake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newStake.action, amount: Number(newStake.amount), notes: newStake.notes || null })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Failed.");
      setNewStake({ action: "DEPOSIT", amount: "", notes: "" });
      await refreshStake();
    } catch (e: any) {
      setError(e?.message ?? "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addPenalty() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/nodes/${nodeId}/penalties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newPenalty.type, reason: newPenalty.reason, amount: newPenalty.amount ? Number(newPenalty.amount) : null })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Failed.");
      setNewPenalty({ type: "FREEZE", reason: "", amount: "" });
      await refreshPenalties();
    } catch (e: any) {
      setError(e?.message ?? "Failed.");
    } finally {
      setBusy(false);
    }
  }

  const runningBalance = [...stake].reverse().reduce((sum, e) => {
    if (e.action === "DEPOSIT") return sum + e.amount;
    if (e.action === "WITHDRAW" || e.action === "SLASH") return sum - e.amount;
    return sum;
  }, 0);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Link href="/dashboard/nodes" className="muted" style={{ fontSize: 13, display: "inline-block" }}>
        &larr; Back to Node registry
      </Link>

      {error ? <p className="form-error">{error}</p> : null}

      {/* Seats */}
      <div className="card" style={{ padding: 14 }}>
        <div className="pill" style={{ marginBottom: 10 }}>Seats ({seats.length})</div>
        {!readOnly ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <label className="field" style={{ flex: "0 0 80px" }}>
              <span className="label">Level</span>
              <input type="number" value={newSeat.level} onChange={(e) => setNewSeat((s) => ({ ...s, level: e.target.value }))} />
            </label>
            <label className="field" style={{ flex: "0 0 120px" }}>
              <span className="label">Status</span>
              <select value={newSeat.status} onChange={(e) => setNewSeat((s) => ({ ...s, status: e.target.value }))}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="FROZEN">FROZEN</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </label>
            <button className="button-secondary" type="button" disabled={busy} onClick={addSeat} style={{ alignSelf: "flex-end" }}>
              Add seat
            </button>
          </div>
        ) : null}
        <div className="apps-list">
          {seats.map((s) => (
            <div key={s.id} className="apps-row" style={{ cursor: "default" }}>
              <div>
                <span style={{ fontWeight: 800 }}>Level {s.level}</span>
                <span className="muted" style={{ marginLeft: 8 }}>{s.status}</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{new Date(s.createdAt as any).toLocaleDateString()}</span>
            </div>
          ))}
          {seats.length === 0 ? <p className="muted" style={{ margin: 0 }}>No seats allocated.</p> : null}
        </div>
      </div>

      {/* Stake Ledger */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="pill">Stake Ledger ({stake.length})</div>
          <div className="pill" style={{ background: runningBalance >= 0 ? "var(--green-bg)" : "var(--red-bg)" }}>
            Balance: {runningBalance.toLocaleString()}
          </div>
        </div>
        {!readOnly ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <label className="field" style={{ flex: "0 0 120px" }}>
              <span className="label">Action</span>
              <select value={newStake.action} onChange={(e) => setNewStake((s) => ({ ...s, action: e.target.value }))}>
                <option value="DEPOSIT">DEPOSIT</option>
                <option value="WITHDRAW">WITHDRAW</option>
                <option value="FREEZE">FREEZE</option>
                <option value="UNFREEZE">UNFREEZE</option>
                <option value="SLASH">SLASH</option>
              </select>
            </label>
            <label className="field" style={{ flex: "0 0 100px" }}>
              <span className="label">Amount</span>
              <input type="number" value={newStake.amount} onChange={(e) => setNewStake((s) => ({ ...s, amount: e.target.value }))} />
            </label>
            <label className="field" style={{ flex: 1, minWidth: 120 }}>
              <span className="label">Notes</span>
              <input value={newStake.notes} onChange={(e) => setNewStake((s) => ({ ...s, notes: e.target.value }))} />
            </label>
            <button className="button-secondary" type="button" disabled={busy} onClick={addStake} style={{ alignSelf: "flex-end" }}>
              Record
            </button>
          </div>
        ) : null}
        <div className="apps-list">
          {stake.map((e) => (
            <div key={e.id} className="apps-row" style={{ cursor: "default" }}>
              <div>
                <span style={{ fontWeight: 800 }}>{e.action}</span>
                <span style={{ marginLeft: 8 }}>{e.amount.toLocaleString()}</span>
                {e.notes ? <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>{e.notes}</span> : null}
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{new Date(e.createdAt as any).toLocaleDateString()}</span>
            </div>
          ))}
          {stake.length === 0 ? <p className="muted" style={{ margin: 0 }}>No stake entries.</p> : null}
        </div>
      </div>

      {/* Penalties */}
      <div className="card" style={{ padding: 14 }}>
        <div className="pill" style={{ marginBottom: 10 }}>Penalties ({penalties.length})</div>
        {!readOnly ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <label className="field" style={{ flex: "0 0 120px" }}>
              <span className="label">Type</span>
              <select value={newPenalty.type} onChange={(e) => setNewPenalty((s) => ({ ...s, type: e.target.value }))}>
                <option value="FREEZE">FREEZE</option>
                <option value="SLASH">SLASH</option>
                <option value="DOWNGRADE">DOWNGRADE</option>
              </select>
            </label>
            <label className="field" style={{ flex: 1, minWidth: 150 }}>
              <span className="label">Reason</span>
              <input value={newPenalty.reason} onChange={(e) => setNewPenalty((s) => ({ ...s, reason: e.target.value }))} />
            </label>
            <label className="field" style={{ flex: "0 0 100px" }}>
              <span className="label">Amount</span>
              <input type="number" value={newPenalty.amount} onChange={(e) => setNewPenalty((s) => ({ ...s, amount: e.target.value }))} placeholder="Optional" />
            </label>
            <button className="button-secondary" type="button" disabled={busy || !newPenalty.reason.trim()} onClick={addPenalty} style={{ alignSelf: "flex-end" }}>
              Add penalty
            </button>
          </div>
        ) : null}
        <div className="apps-list">
          {penalties.map((p) => (
            <div key={p.id} className="apps-row" style={{ cursor: "default" }}>
              <div>
                <span style={{ fontWeight: 800 }}>{p.type}</span>
                {p.amount !== null ? <span style={{ marginLeft: 8 }}>{p.amount.toLocaleString()}</span> : null}
                <div className="muted" style={{ fontSize: 13 }}>{p.reason}</div>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{new Date(p.createdAt as any).toLocaleDateString()}</span>
            </div>
          ))}
          {penalties.length === 0 ? <p className="muted" style={{ margin: 0 }}>No penalties.</p> : null}
        </div>
      </div>
    </div>
  );
}
