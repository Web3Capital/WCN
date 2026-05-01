/**
 * ArchitectureLayers — visual diagram of WCN's five-layer stack.
 *
 * Each layer is rendered as a stacked card with its name on the left,
 * a short caption on the right, and a connecting voltage rail running
 * down the left edge. Layer 5 (storage) is the foundation; layer 1
 * (surface) is the top.
 *
 * The visual stacking signals "every interaction flows through every
 * layer" — no back doors, no side channels. A small "audit pulse"
 * travels down the rail.
 *
 * Server component (the pulse animation is pure CSS).
 */

type Layer = {
  n: number;
  label: string;
  sub: string;
  /** Optional: what flows through this layer (mono code/event signature) */
  flow?: string;
};

type Props = {
  layers: Layer[];
  /** Optional caption shown above the diagram describing the example request */
  flowExample?: string;
};

export function ArchitectureLayers({ layers, flowExample }: Props) {
  return (
    <div className="architecture-layers" data-anim-host>
      {flowExample ? (
        <p className="architecture-flow-example">
          <span className="architecture-flow-example-label">Example request</span>
          <span className="architecture-flow-example-text">{flowExample}</span>
        </p>
      ) : null}
      <div className="architecture-rail" aria-hidden>
        <span className="architecture-rail-pulse" />
      </div>
      <ol className="architecture-stack">
        {layers.map((layer) => (
          <li key={layer.n} className="architecture-layer" data-layer={layer.n}>
            <span className="architecture-layer-num">L{layer.n}</span>
            <div className="architecture-layer-text">
              <h3 className="architecture-layer-label">{layer.label}</h3>
              <p className="architecture-layer-sub">{layer.sub}</p>
              {layer.flow ? (
                <code className="architecture-layer-flow">{layer.flow}</code>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
