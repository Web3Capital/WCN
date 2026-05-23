/**
 * WhyNowTimeline — vertical chronology of why this moment, not earlier.
 *
 * Each entry shows a year on the left rail, the headline on the right,
 * and a body paragraph below. The rail itself is a thin line with a
 * tick at every year, terminating at "Now" which is highlighted.
 *
 * Motion: when the whole timeline enters the viewport, the rail draws
 * itself downward and each entry stamps in with a staggered tick. The
 * "Now" tick keeps a slow voltage breath after reveal. All styled in
 * globals.css under "SOVEREIGN MOTION".
 *
 * Server component — the reveal flag is set by the global ScrollReveal
 * client observer (one observer for the whole page).
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
    <div className="why-now-timeline" data-reveal="fade">
      <ol className="why-now-rail">
        {entries.map((entry, i) => (
          <li
            key={entry.year}
            className="why-now-entry"
            data-highlight={entry.highlight ? "true" : "false"}
            data-reveal="fade"
            style={{ ["--reveal-i" as string]: i }}
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
