/**
 * ThreeInnovations — the home page's № 01 signature block.
 *
 * White paper v2.1 §01 names three core innovations that sit on ONE logic
 * chain: the global node network, the AI agent execution system, and Proof
 * of Business. That single-chain framing is the whitepaper's stated
 * differentiator ("这是 WCN 与任一单点方案的根本区别"), so the section leads
 * with substance rather than a soft list of principles.
 *
 * Editorial 3-up. The PoB card carries the sole authority treatment — a
 * bronze hairline rule + a "Verified" label — as the chain's verification
 * anchor. Per Decision A this is hairline + text only (no bronze FILL), so
 * the viewport keeps a single, meaningful bronze signal.
 *
 * Server component — no interactivity.
 */

type Innovation = {
  index: string;
  title: string;
  body: string;
  tag: string;
  /** PoB → the verification anchor. Renders the bronze authority treatment. */
  authority?: boolean;
  /** Authority label (e.g. "Verified / 已验证"), shown only on the authority card. */
  verifiedLabel?: string;
};

type Props = {
  items: Innovation[];
  caption?: string;
};

export function ThreeInnovations({ items, caption }: Props) {
  return (
    <div className="innovations">
      <ol className="innovations-chain">
        {items.map((it) => (
          <li
            key={it.index}
            className="innovation"
            {...(it.authority ? { "data-authority": "verified" } : {})}
          >
            <div className="innovation-head">
              <span className="innovation-index">{it.index}</span>
              <span className="innovation-rule" aria-hidden />
            </div>
            <h3 className="innovation-title">{it.title}</h3>
            <p className="innovation-body">{it.body}</p>
            <span className="innovation-tag">
              {it.authority && it.verifiedLabel ? (
                <span className="innovation-verified">{it.verifiedLabel}</span>
              ) : null}
              {it.tag}
            </span>
          </li>
        ))}
      </ol>
      {caption ? (
        <p className="innovations-caption" aria-hidden>
          {caption}
        </p>
      ) : null}
    </div>
  );
}
