# Design system

The timer is the home screen: no marketing page. Coach, Train and Learn require a Google account; the timer, stats and algorithms stay available signed out. Since the UI overhaul (inspired by [TAGDA Timer](https://tagdatimer.vercel.app) and [csTimer](https://cstimer.net) at the owner's request), the look is immersive rather than neutral: an animated shader background, frosted-glass panels, large expressive digits and motion that responds to input. A still, minimal preset (Graphite, id `carbon`) remains for anyone who prefers the earlier calm look.

## Themes

Six presets, chosen in the Appearance sheet (press `T`) or Settings, plus "Match system" (Sencha when the device is dark, Linen when light). Internal ids are unchanged (`nebula`, `ember`, …) so saved appearance still works. Appearance is saved in the settings record, so it is backed up and follows the Google account like every other setting (since 3.1). localStorage keeps a copy that a tiny boot script in `<head>` applies before first paint, so there is no flash.

| Label    | Id      | Mood                 | Background                  |
| -------- | ------- | -------------------- | --------------------------- |
| Ion      | nebula  | Violet + teal aurora | Animated mesh gradient      |
| Forge    | ember   | Warm orange glow     | Animated mesh gradient      |
| Fjord    | glacier | Cold blue depths     | Animated mesh gradient      |
| Sencha   | matcha  | Terminal green       | Animated mesh gradient      |
| Graphite | carbon  | Still and minimal    | Solid, no animation         |
| Linen    | paper   | Light and warm       | Soft animated mesh gradient |

Surface and text tokens live in `app/globals.css` under `[data-theme="…"]`; background recipes and swatches in `lib/appearance/themes.ts`. Components use tokens only.

The background is a WebGL mesh gradient from `@paper-design/shaders` (the shader behind 21st.dev's shader-background components). It pauses during solves by default, stops for reduced motion, renders at capped resolution, and falls back to a single still frame when the browser only has a software (CPU) WebGL renderer, so it never competes with the timer.

## Timer

- **Digits:** three styles — Clean (Geist Mono), LCD (DSEG7, with faint "ghost" segments like a real display) and Dot (Doto) — plus a size slider.
- **States:** holding shows a red hold meter that fills to green when armed; inspection shows an amber draining bar with 8 s/12 s marks; running hides everything but the digits; stopping gives a small spring "pop".
- **Live averages:** Ao5 and Ao12 under the digits (csTimer-style), rolling with NumberFlow.
- **Panels:** Times (sortable by time/Ao5/Ao12), Session stats (current/best, mean, σ, sparkline with hover readout) and Scramble preview (interactive 3D cube you can drag, or a flat net). On large screens every panel can be dragged by its handle and remembers its position.
- **Scramble bar:** previous/next (`P`/`N`), copy (`C`), enter your own (`X`).
- **Personal bests:** a border-beam badge on the last solve, a toast, and an optional confetti burst.
- **Input:** Space on keyboards, touch-and-hold on touch screens. Mouse clicks never start or stop the timer.

## Navigation and commands

A floating pill navigation with a sliding "tubelight" indicator (bottom tab bar on phones). ⌘K / Ctrl+K opens a command palette with every action (timer, scramble, session, navigation, themes); `?` lists shortcuts. Single-key shortcuts never fire while typing, while a dialog is open, or during a solve.

## 21st.dev components

21st.dev hides component code behind sign-in and limits free accounts to two downloads a day, so components were chosen on 21st.dev and taken from their authors' public open-source registries where possible:

| Used for                  | Component on 21st.dev                                                           | Source                        |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| Card borders that glow    | [Glowing Effect](https://21st.dev/@aceternity/components/glowing-effect)        | Aceternity UI registry        |
| PB badge and toast        | [Border Beam](https://21st.dev/@dillionverma/components/border-beam)            | Magic UI registry             |
| Stat tile hover highlight | [Magic Card](https://21st.dev/@dillionverma/components/magic-card)              | Magic UI (adapted)            |
| PB confetti               | [Confetti](https://21st.dev/@dillionverma/components/confetti)                  | canvas-confetti (Magic UI)    |
| Rolling numbers           | Number Flow                                                                     | `@number-flow/react`          |
| Animated background       | Shader background collection                                                    | `@paper-design/shaders-react` |
| Navigation indicator      | [Tubelight Navbar](https://21st.dev/@ayushmxxn/components/tubelight-navbar)     | Rebuilt with motion layout    |
| Stat tiles (earlier)      | [Stat card collection](https://21st.dev/community/components/explore/stat-card) | Pattern                       |

All adaptations swap hard-coded colors for theme tokens. shadcn/ui remains the base component system; icons are Lucide.

## Charts

Charts follow the data-viz method: one y-axis, 2 px lines, thin rounded bars, hairline grids, legends for multi-series charts, a crosshair tooltip, and a table view for every chart. Each entity keeps one color everywhere (Ao5, Ao12, Ao100 use validated categorical slots; singles are neutral).

## Accessibility

Skip link, semantic landmarks, visible focus rings, labeled controls, `aria-current` navigation, live-region timer announcements, Radix dialogs with focus management, tables for chart data, plain-text copies of animated numbers for screen readers, and reduced-motion support (no shader animation, confetti or spins). The keyboard guard never takes Space from inputs, dialogs or keyboard-focused buttons.
