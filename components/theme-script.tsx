/**
 * ThemeScript — synchronous inline script that sets `<html data-theme>`
 * before first paint, reading the `wcn_theme` cookie.
 *
 * Phase 2 of marketing-redesign (see docs/marketing-redesign.md ADR-MR-002).
 * Replaces the previous `cookies()` call in app/[locale]/layout.tsx, which
 * forced every page under [locale] into dynamic rendering. Inline script runs
 * synchronously in <head>, so the resolved theme is applied before any CSS
 * paints — no FOUC.
 *
 * Phase 4 wires this into the nonce-based CSP. Until then it relies on the
 * existing `'unsafe-inline'` script-src allowance.
 */

type Props = {
  /** CSP nonce. Set in Phase 4 after proxy.ts starts emitting per-request nonces. */
  nonce?: string;
};

const SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )wcn_theme=([^;]+)/);var t=m&&(m[1]==='light'||m[1]==='dark')?m[1]:'system';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeScript({ nonce }: Props) {
  return (
    <script
      // eslint-disable-next-line react/no-danger -- inline theme bootstrap is intentional; CSP nonce wired in Phase 4
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      nonce={nonce}
    />
  );
}
