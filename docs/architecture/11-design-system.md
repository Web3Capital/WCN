# Design System & UI Migration Playbook

Living guide for the project's UI layer. Read top-to-bottom on first onboarding.
After that, jump to the section you need.

## Stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14.2 App Router | Next 16 upgrade tracked separately |
| CSS engine | Tailwind v3.4 + PostCSS | Preflight **disabled** — handwritten CSS owns the reset |
| Component primitives | shadcn/ui (`new-york` style) on Radix UI | Source-owned in `components/ui/*` |
| Icon library | lucide-react | Optimized via `experimental.optimizePackageImports` |
| Toast | sonner | `<Toaster />` is included; render at app root if needed |
| Fonts | `next/font/google` — Inter (body) + JetBrains Mono (code) | Self-hosted; CJK/Arabic fall back to system stack |
| i18n | next-intl, 10 locales including RTL Arabic | RTL handled via logical CSS properties |

## Token system — single source of truth

CSS variables in [`app/globals.css`](../../app/globals.css) `:root` are the
foundation. Every other layer references them.

```
:root {
  --bg / --bg-elev / --bg-soft / --card / --surface / --line / --text / --muted
  --accent / --accent-hover / --accent-2 / --link
  --blue --green --red --orange --amber --yellow --purple --pink --teal --indigo  (each + -bg)
  --shadow-sm / --shadow-md / --shadow-lg / --focus
  --radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-pill
  --ease-out / --ease-inout / --ease-spring
  --dur-1 / --dur-2 / --dur-3
  --max / --max-wide
}
```

`html[data-theme="dark"]` overrides for dark.
`html[data-theme="system"]` + `prefers-color-scheme: dark` covers OS-driven dark.

### Tailwind ↔ shadcn ↔ project-token mapping

[`tailwind.config.ts`](../../tailwind.config.ts) bridges all three naming conventions
to the same CSS variables:

| shadcn class | project CSS var | Project legacy alias |
|---|---|---|
| `bg-background` / `text-foreground` | `--bg` / `--text` | `bg-bg` / `text-text` |
| `bg-card` / `text-card-foreground` | `--card` / `--text` | `bg-card` |
| `bg-primary` / `text-primary-foreground` | `--accent` / `#ffffff` | `bg-brand` |
| `bg-secondary` | `--bg-elev` | — |
| `bg-muted` | `--bg-elev` | `bg-bg-elev` |
| `text-muted-foreground` | `--muted` | — |
| `bg-accent` (subtle hover) | `--bg-elev` | — |
| `bg-destructive` / `text-destructive-foreground` | `--red` / `#ffffff` | `bg-red` |
| `border-border` | `--line` | `border-line` |
| `ring-ring` | `--accent` | — |

⚠️ **Naming gotcha**: project CSS variable `--accent` is the BRAND color (#0071e3).
shadcn's class `bg-accent` is a SUBTLE HOVER surface (project's `--bg-elev`).
Same word, different meanings. The Tailwind theme decouples them safely.

## When to use what (decision tree)

```
Building new UI?
├─ Standard primitive needed (button, input, dialog, dropdown, etc.)
│   → Use shadcn from `components/ui/*`. Compose with Tailwind utilities.
│
├─ A shadcn primitive doesn't exist for it
│   → Add via `npx shadcn@latest add <name>` (CLI v4)
│
├─ Layout / spacing / color / typography
│   → Tailwind utility classes (referencing tokens above)
│
├─ Complex domain-specific styling that recurs in many places
│   → Add to `app/globals.css` in the appropriate section. Keep new selectors
│     scoped (use BEM-ish prefixes), avoid bare element selectors.
│
└─ One-off visual polish
    → Inline Tailwind classes on the element. Don't add to globals.css.
```

## Migrating an existing component — pattern from `ThemeToggle`

[`components/theme-toggle.tsx`](../../components/theme-toggle.tsx) is the canonical
sample. Walk through its delta vs. the old `<button className="theme-toggle">`:

1. **Lift state out of the parent** — make the new component self-contained
   (own its `useState`, own its `useEffect` for cookie reads, own its API call).
2. **Replace handcrafted dropdown / popover with a shadcn primitive** — get
   keyboard nav, focus management, ARIA, escape-to-close, click-outside for free.
3. **Use Tailwind classes referencing tokens** — not hex values, not raw `var()`.
4. **Use logical CSS properties** — `me-2` not `mr-2` for icon-text gaps.
5. **In the parent**: remove the now-unused state, effect, handler, and JSX.
   Drop the corresponding lucide-react icon imports if no longer used here.

For a component already in `components/`, the migration template:

```tsx
// before
"use client";
import { Sun, Moon } from "lucide-react";
function Foo() {
  const [open, setOpen] = useState(false);
  // ... 50 lines of dropdown plumbing ...
  return <button className="custom-toggle">...</button>;
}

// after
"use client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";
function Foo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><Sun className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={...}>Option</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Net: ~50 lines down to ~10, plus accessibility and theming for free.

## RTL rules

The project supports Arabic. **Always** use logical properties for any new code:

| Don't write | Write |
|---|---|
| `margin-left`, `margin-right` | `margin-inline-start`, `margin-inline-end` |
| `padding-left`, `padding-right` | `padding-inline-start`, `padding-inline-end` |
| `border-left`, `border-right` | `border-inline-start`, `border-inline-end` |
| `text-align: left` / `right` | `text-align: start` / `end` |
| Tailwind `ml-4`, `mr-4` | `ms-4`, `me-4` |
| Tailwind `pl-2`, `pr-2` | `ps-2`, `pe-2` |
| Tailwind `text-left`, `text-right` | `text-start`, `text-end` |

**Icons that point a direction** (chevrons, arrows, breadcrumb separators) need
explicit horizontal flipping in RTL:
```css
html[dir="rtl"] svg.lucide-chevron-right { transform: scaleX(-1); }
```
Add new icon classes to the `RTL` block at the bottom of `globals.css`.

shadcn components added via the CLI: run `npx shadcn@latest migrate rtl` after
adding new components — converts their `ml-*` to `ms-*` automatically.

## Performance hygiene

| Concern | Status | Action |
|---|---|---|
| `lucide-react` 49+ imports | ✅ `optimizePackageImports` enabled | Confirmed — only ~31KB gzip in client bundle |
| `recharts` 113KB gzip | ⚠️ Loaded on every dashboard page | TODO: wrap chart components in `next/dynamic` for tab/fold-gated charts |
| Bundle analysis | ✅ Available | `npm run analyze` opens visualizer in browser |
| Font loading | ✅ Self-hosted with `next/font` + `display: swap` | No FOIT, fallback metrics tuned |

## Future work (post-this-PR)

| Item | Why | Risk |
|---|---|---|
| Split `globals.css` into `app/styles/{tokens,base,marketing,docs,dashboard,footer,auth}.css` and `@import` from globals | 6,000-line CSS becomes navigable | Medium — must preserve cascade order; do as one PR with screenshots |
| Migrate language switcher in `components/nav.tsx` to shadcn DropdownMenu (same pattern as ThemeToggle) | Accessibility + consistency | Low |
| Migrate mobile drawer to shadcn Sheet | Better keyboard/focus, less custom JS | Low-medium |
| Migrate mega menu (Network/Resources) to shadcn NavigationMenu (`shadcn add navigation-menu`) | Standard mega-menu patterns | Medium — complex hover/focus state |
| Convert long-tail `left:`/`right:` positioning (~37 occurrences in globals.css) to `inset-inline-start`/`inset-inline-end` for full RTL parity | Arabic locale visual fidelity | Low individually, audit needed |
| Wrap dashboard chart imports in `next/dynamic({ ssr: false })` | Cut TTI for non-chart-viewing dashboard sub-pages | Low |
| Evaluate Next.js 14 → 16 upgrade (Turbopack stable, Cache Components, `proxy.ts`) | Structural perf + DX wins | High — needs codemod, async API migration, full regression test |

## Anti-patterns

- ❌ Adding new `--my-color` variables — extend the existing token set instead
- ❌ Adding `.btn-foo` rules in globals.css when `<Button variant="...">` could carry the variant
- ❌ Mixing arbitrary hex values in JSX — use token-backed Tailwind classes
- ❌ Nesting `<Dialog>` inside `<Dialog>` — use `<Sheet>` or page navigation
- ❌ Using `Dialog` for destructive confirmation — use `AlertDialog`
- ❌ `useEffect` for theme cookie reading in parent components — co-locate inside the component that owns the toggle
- ❌ Adding `mr-*`, `ml-*`, `text-left`, `text-right` Tailwind classes in new code — use logical equivalents
- ❌ Disabling Preflight elsewhere or re-enabling it — the app's reset depends on Preflight being off

## Quick reference: shadcn primitives available

`button`, `input`, `label`, `card`, `separator`, `dialog`, `alert-dialog`,
`sheet`, `dropdown-menu`, `popover`, `tooltip`, `tabs`, `badge`, `avatar`,
`sonner`. Add more via `npx shadcn@latest add <name>`.
