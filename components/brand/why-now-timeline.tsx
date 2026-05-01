/**
 * WhyNowTimeline — vertical chronology of why this moment, not earlier.
 *
 * Each entry shows a year on the left rail, the headline on the right,
 * and a body paragraph below. The rail itself is a thin line with a
 * tick at every year, terminating at "Now" which is highlighted.
 *
 * Server component.
 */

type Entry = {
  year: string;
  body: string;
  highlight?: boolean;
};

type Props = {
  entries: Entry[];
};

export function WhyNowTimeline({ entries }: Props) {
  return (
    <div className="why-now-timeline">
      <ol className="why-now-rail">
        {entries.map((entry, i) => (
          <li
            key={entry.year}
            className="why-now-entry"
            data-highlight={entry.highlight ? "true" : "false"}
          >
            <div className="why-now-tick" aria-hidden />
            <div className="why-now-content">
              <span className="why-now-year">{entry.year}</span>
              <p className="why-now-body">{entry.body}</p>
            </div>
            {i < entries.length - 1 ? <span className="why-now-rail-segment" aria-hidden /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
