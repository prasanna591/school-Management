# SmartSchool Design System

**Goal:** The product should feel designed by an expert product design team — calm, trustworthy, warm, modern. Parents feel at ease; staff feel fast.

## Principles
1. **Calm trust** — soft surfaces, generous whitespace, one primary action per screen, no clutter.
2. **Role-appropriate** — parents get nurturing tone; teachers/staff get density and speed.
3. **Indic-first** — Tamil + Devanagari typography tested; text expands, never clips critical info.
4. **Accessible by default** — WCAG AA contrast, 44pt min touch targets, screen-reader labels, reduced-motion respected.
5. **One component, everywhere** — no near-duplicate buttons/cards/forms.

## Tokens (single source: `packages/shared/tokens.ts`)

### Color
- Neutral scale (slate-50 → slate-900) for surfaces/text/borders.
- Tenant brand color → derived accessible palette: hover, pressed, subtle background, on-color text.
- Semantic colors always paired with icon + text, never color alone: success (green), warning (amber), danger (red), info (blue).
- Color-blind-safe chart palette.
- Light and dark themes.

### Typography
- Single versatile family with Indic coverage: Latin + Tamil (Lohit Tamil / Namil) + Devanagari (Mukta / Noto Sans Devanagari) fallbacks.
- Type scale: caption/overline (12), body (14), body-large (16), heading-sm (18), heading (20), heading-lg (24), display (32).
- Tabular numerals for money and tables.

### Spacing / Radius / Motion
- 4/8px grid: 4, 8, 16, 24, 32.
- Radius: sm 6, md 10, lg 16.
- Motion: 150–250ms ease-out; respects `prefers-reduced-motion`.

## Core components (build only what screens need)
Button, IconButton, Input/Field (inline validation), Select, DatePicker, Checkbox/Switch, Card, Badge/StatusPill, Avatar (photo or initials), List item, Tabs, Sheet/Dialog, Toast with undo, Skeleton, EmptyState (light illustration + one action), ErrorState with retry, Table (web), Chart wrapper (web), Stat/KPI card.

## Patterns
- Loading skeletons (not spinners) for content.
- Optimistic updates with rollback.
- Destructive actions: confirmation with consequence stated.
- Forms keep drafts; unsaved-changes guard.
- Every list: search + filters + pagination + empty/error states.
- Writing tone: plain, kind, specific ("Fee due 5 Dec" not "Payment pending").

## Verification
- Dev-only component gallery: `/design` route on web, hidden screen on mobile.
- All components in all states, English + Tamil, light + dark.
- Screenshots reviewed against alignment, spacing, truncation, contrast.
