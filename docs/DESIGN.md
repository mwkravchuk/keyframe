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

- Background: near-black / graphite (#06080d)
- Surface: slightly lifted dark (#0d111a)
- Borders: subtle (#20283a)
- Primary text: near white (#f2f5fb)
- Muted text: desaturated blue-gray (#8f9bb3)

### Accent

- Use ONE accent color:
  - blue-violet OR soft cyan
- Example: #7c8cff or #8bbcff

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
- Slight rounding (no pill-shaped blobs everywhere)
- Subtle hover states
- Primary button uses accent color
- Secondary = ghost or outline

### Cards

- Only when necessary
- Subtle borders
- No heavy shadows
- Medium radius (rounded-xl max)

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

- `--background`: `#06080d`
- `--surface`: `#0d111a`
- `--surface-2`: `#121827`
- `--border`: `#20283a`
- `--text`: `#f2f5fb`
- `--text-muted`: `#8f9bb3`
- `--accent`: `#7c8cff`
- `--accent-foreground`: `#eef1ff`
- `--focus-ring`: `color-mix(in oklab, var(--accent) 65%, white 35%)`

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

- `--radius-sm`: `0.375rem`
- `--radius-md`: `0.5rem`
- `--radius-lg`: `0.75rem`
- `--radius-xl`: `0.875rem`

#### Typography Scale

- `display`: `2.25rem / 1.1 / 600`
- `h1`: `1.875rem / 1.15 / 600`
- `h2`: `1.25rem / 1.25 / 600`
- `body`: `0.95rem / 1.6 / 400`
- `small`: `0.8125rem / 1.5 / 500`
- `caption`: `0.75rem / 1.4 / 500`

### Layout Rules

- Desktop app shell: `280px` sidebar + fluid main content.
- Page content max-width: `1120px`.
- Vertical section rhythm: `--space-10` or `--space-12`.
- Dividers over containers whenever possible.

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
