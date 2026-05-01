"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { colorForStatus } from "./badge-colors";

/**
 * StatusPill — a hoverable / focusable status badge that reveals the
 * machine's valid next transitions.
 *
 * Design intent (from `docs/architecture/12-console-system-design.md`
 * §5 P3 + §8 #5): "the status pill on a row or detail page is a
 * clickable affordance; clicking shows current/next/needs-who. SM is a
 * product feature, not backend plumbing."
 *
 * Server-side decoupling: the component intentionally does NOT import
 * any state-machine module. Server callers pre-compute `validNext` via
 * `validNextNodeStatuses(status)` (or the corresponding helper for the
 * entity) and pass the resulting `string[]` in. This keeps `eventBus`
 * and other server-only deps out of the client bundle.
 *
 * Usage:
 *
 *   import { validNextNodeStatuses } from "@/lib/core/state-machine";
 *   import { StatusPill } from "@/components/console-kit/status-pill";
 *
 *   // server component
 *   <StatusPill
 *     status={node.status}
 *     validNext={validNextNodeStatuses(node.status)}
 *     entityType="Node"
 *   />
 */
export interface StatusPillProps {
  /** Current status (e.g. "REVIEWING", "LIVE"). */
  status: string;
  /** Valid next states, pre-computed by the caller from the SM. */
  validNext: readonly string[];
  /** Domain label shown in the popover header. e.g. "Node", "Deal". */
  entityType: string;
  /** Optional class on the trigger badge. */
  className?: string;
  /** Override default delay before the tooltip appears (ms). */
  delayDuration?: number;
  /** Per-target hint, e.g. "FINANCE_ADMIN" for a settlement transition. */
  renderTransitionHint?: (target: string) => React.ReactNode;
}

function humanize(s: string): string {
  return s.replace(/_/g, " ");
}

export function StatusPill({
  status,
  validNext,
  entityType,
  className,
  delayDuration = 200,
  renderTransitionHint,
}: StatusPillProps) {
  const color = colorForStatus(status);
  const isTerminal = validNext.length === 0;

  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className={`badge ${color} ${className ?? ""}`.trim()}
            tabIndex={0}
            role="button"
            aria-label={`${entityType} status: ${humanize(status)}. Press for transition details.`}
            data-status-pill="true"
          >
            {humanize(status)}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="status-pill-popover"
            sideOffset={6}
            collisionPadding={8}
          >
            <div className="status-pill-popover-header">{entityType}</div>
            <div className="status-pill-popover-row">
              <span className="muted">Current:</span>
              <span className={`badge ${color}`}>{humanize(status)}</span>
            </div>
            {isTerminal ? (
              <div className="status-pill-popover-row muted">
                Terminal state — no further transitions.
              </div>
            ) : (
              <div className="status-pill-popover-row">
                <span className="muted">Next:</span>
                <ul className="status-pill-popover-list">
                  {validNext.map((target) => (
                    <li key={target}>
                      <span className={`badge ${colorForStatus(target)}`}>
                        {humanize(target)}
                      </span>
                      {renderTransitionHint ? (
                        <span className="status-pill-hint muted">
                          {renderTransitionHint(target)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Tooltip.Arrow className="status-pill-popover-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
