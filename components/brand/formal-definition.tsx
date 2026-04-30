/**
 * FormalDefinition — the mathematical reveal of WCN as a tuple.
 *
 * This is the about-page centerpiece. Renders:
 *
 *   WCN  =  ( I ,  N ,  R ,  D ,  T ,  P ,  S ,  G ,  A ,  L ,  X )
 *
 * — set in JetBrains Mono with each variable annotated by its English/Chinese
 * meaning. Hovering a variable highlights its annotation; on mobile, all
 * annotations are visible by default. No JS interactivity required for the
 * core read; CSS hover state lights up the column.
 *
 * Server component.
 */

type Variable = { letter: string; label: string };

type Props = {
  label: string;
  eq: string;
  variables: Variable[];
  caption: string;
};

export function FormalDefinition({ label, eq, variables, caption }: Props) {
  return (
    <div className="formal-definition" role="figure" aria-label={`${label} ${eq} (${variables.map((v) => v.letter).join(", ")})`}>
      <div className="formal-definition-equation" aria-hidden>
        <span className="formal-definition-label">{label}</span>
        <span className="formal-definition-eq">{eq}</span>
        <span className="formal-definition-paren formal-definition-paren-l">(</span>
        <ol className="formal-definition-vars">
          {variables.map((v, i) => (
            <li key={v.letter} className="formal-definition-var" data-index={i}>
              <span className="formal-definition-letter">{v.letter}</span>
              <span className="formal-definition-label-mini">{v.label}</span>
              {i < variables.length - 1 ? <span className="formal-definition-comma" aria-hidden>,</span> : null}
            </li>
          ))}
        </ol>
        <span className="formal-definition-paren formal-definition-paren-r">)</span>
      </div>
      <p className="formal-definition-caption">{caption}</p>
    </div>
  );
}
