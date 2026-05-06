# Keyframe Design System

## Philosophy

Keyframe should feel like a cinematic, minimal, high-trust creator command center.

Avoid generic SaaS design patterns. Favor clarity, structure, and restraint.

Think: Linear + film production tools.

---

## Layout

- Avoid large card-based layouts as the default.
- Prefer open, editorial layouts with whitespace.
- Use thin dividers instead of heavy containers.
- Cards are only used for:
  - video projects
  - analytics modules
- No "big rounded hero boxes".

---

## Color

### Dark Mode (primary)

- Background: near-black (#060606)
- Surface: lifted charcoal (#0d0d0d)
- Borders: neutral dark gray (#2a2a2a)
- Primary text: near white (#f5f5f5)
- Muted text: neutral mid-gray (#9a9a9a)

### Accent

- Base UI accent is monochrome only.
- Dark mode: white accent on black surfaces.
- Light mode: black accent on white surfaces.

### Stage Color Exception

- Rainbow stage colors are allowed only for pipeline semantics.
- Stage chips, lane badges, and stage counts may use color.
- Global UI chrome (headers, buttons, forms, shells) remains black/white.

### Avoid

- bright green as primary accent
- rainbow gradients
- overly saturated colors

---

## Typography

- Typography drives hierarchy, not containers
- Large, confident headings
- Minimal font weight variation
- Tight line-height for headings
- Generous spacing between sections

---

## Components

### Buttons

- Clean, minimal
- Sharp corners or very slight rounding
- Subtle hover states
- Primary button uses monochrome accent
- Secondary = ghost or outline

### Cards

- Only when necessary
- Subtle borders
- No heavy shadows
- Keep corners sharp (rounded-sm to rounded-md)

---

## Interaction

- Fast, responsive feel
- Subtle hover states
- No excessive animation
- Micro-interactions > big motion

---

## Gradients

- Allowed ONLY as ambient background
- Should be subtle and barely noticeable
- Never dominate UI

---

## Overall Tone

- Serious
- Focused
- Minimal
- Trustworthy
- Slightly cinematic

Not playful, not startup-y, not overly colorful.

---

## Implementation Spec

Use this section as the source of truth when building new screens.

### Tokens

#### Color Tokens

- `--background`: `#060606` (dark), `#f5f5f5` (light)
- `--surface`: `#0d0d0d` (dark), `#ffffff` (light)
- `--surface-2`: `#131313` (dark), `#efefef` (light)
- `--border`: `#2a2a2a` (dark), `#d4d4d4` (light)
- `--text`: `#f5f5f5` (dark), `#0a0a0a` (light)
- `--text-muted`: `#9a9a9a` (dark), `#5e5e5e` (light)
- `--accent`: monochrome (`#f5f5f5` dark / `#0a0a0a` light)
- `--accent-foreground`: inverse monochrome
- `--focus-ring`: grayscale ring derived from foreground
- Stage colors are semantic-only and must not leak into core chrome.

#### Spacing Scale

- `--space-1`: `0.25rem`
- `--space-2`: `0.5rem`
- `--space-3`: `0.75rem`
- `--space-4`: `1rem`
- `--space-6`: `1.5rem`
- `--space-8`: `2rem`
- `--space-10`: `2.5rem`
- `--space-12`: `3rem`

#### Radius Scale

- `--radius-sm`: `0.125rem`
- `--radius-md`: `0.2rem`
- `--radius-lg`: `0.3rem`
- `--radius-xl`: `0.4rem`

#### Typography Scale

- `display`: `2.25rem / 1.1 / 600`
- `h1`: `1.875rem / 1.15 / 600`
- `h2`: `1.25rem / 1.25 / 600`
- `body`: `0.95rem / 1.6 / 400`
- `small`: `0.8125rem / 1.5 / 500`
- `caption`: `0.75rem / 1.4 / 500`

### Layout Rules

- Projects and dashboard pages use a top header shell.
- Decorative media banners may be full-bleed across viewport width.
- Page content max-width: `1120px`.
- Vertical section rhythm: `--space-10` or `--space-12`.
- Dividers over containers whenever possible.

### Kanban Layout Rules

- Desktop should prioritize seeing all stages at once.
- Use responsive grid columns (`5` on wide desktop, `2-3` on narrower breakpoints).
- Horizontal scrolling is fallback-only for constrained screens, not default desktop behavior.
- Keep lane widths compact and card copy concise to preserve full-board visibility.

### Deferred Features

- **Review / Insights stage**: Currently not shown as a default pipeline stage.
  - Will only be available contextually when a video is published to YouTube and linked in the app.
  - YouTube Creator Studio already provides insights, so app integration deferred until clearer UX emerges.
  - If added: should be accessible from Published video details, not as a default Kanban column.

### Component Rules

#### Button Implementation

- Primary: accent fill, subtle hover lift, no pill radius.
- Secondary: transparent/outline with border.
- All button states must exist: default, hover, focus-visible, disabled, loading.

#### Inputs

- Use `surface` background + `border` stroke.
- Focus uses `--focus-ring` and accent border.
- No fully rounded input pills in core product UI.

#### Card Implementation

- Allowed for project and analytics content only.
- Border-first depth; avoid heavy shadows.

### Motion Rules

- Use 120ms to 200ms transitions for hover/focus.
- Use slight fade/translate entrance only for page-level reveals.
- Respect reduced-motion settings and disable non-essential animation.

### Accessibility Rules

- Body text contrast target: WCAG AA minimum.
- All interactive controls must have visible focus states.
- Never communicate state with color alone.
