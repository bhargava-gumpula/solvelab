# Design system

The timer is the home screen: no marketing page. Coach, Train and Learn require a Google account; the timer, stats and algorithms stay available signed out. Since the UI overhaul (inspired by [TAGDA Timer](https://tagdatimer.vercel.app) and [csTimer](https://cstimer.net) at the owner's request) and the release 5 "Studio" pass, the look is immersive rather than neutral: an animated swirl background, outline tiles that let it through, a display serif, large expressive digits and motion that responds to input, all of it calm while a solve is timed.

## Themes

Five presets, chosen in the Appearance sheet (press `T`) or Settings, plus "Match system" (Terracotta when the device is dark, Linen when light). Internal ids are unchanged (`ember`, `carbon`, …) so saved appearance still works; Porcelain (`glacier`) was retired in release 5 and a saved `glacier` opens as Linen (`RETIRED_THEMES` in `lib/appearance/themes.ts`, applied by the Zod preprocess in `lib/appearance/preferences.ts` and by the boot script). Appearance is saved in the settings record, so it is backed up and follows the Google account like every other setting. localStorage keeps a copy that a tiny boot script in `<head>` applies before first paint, so there is no flash.

| Label      | Id     | Mood                             | Background                  |
| ---------- | ------ | -------------------------------- | --------------------------- |
| Terracotta | ember  | Warm clay, after hours (default) | Swirl in the theme's tints  |
| Ink        | carbon | Midnight blue                    | Swirl                       |
| Nocturne   | nebula | Indigo midnight                  | Swirl                       |
| Sage       | matcha | Deep green, after dark           | Swirl                       |
| Linen      | paper  | Warm paper, studio blue (light)  | Swirl, lavender and apricot |

Surface and text tokens live in `app/globals.css` under `[data-theme="…"]`; background recipes (rays, aurora, the four swirl tints) and swatches in `lib/appearance/themes.ts`. Components use tokens only.

The background is a WebGL shader from `@paper-design/shaders` (Warp, the "Eddy" variant, by default; `?bg=` tries the others) in the theme's own tints. It pauses while a solve is held or timed, stops for reduced motion, renders at a capped resolution, and falls back to a static paint of the same tints when the browser only has a software (CPU) WebGL renderer. On every page but the timer a soft reading veil calms the swirl down the text column; on the timer a veil sits behind the digits.

## Studio (release 5)

The look that came out of the UI drafts (v6 "Studio", then v7's council rounds; the full story is in `~/Projects/solvelab-ui-drafts/research/v7-council-log.md`):

- **Tiles, not glass.** Every panel is an outline on the swirl (`tile`: a hairline border at the studio radius, squircle where supported; no fill, blur or shadow), so the background shows through. Only floating chrome (the nav capsule, the phone dock, the command palette) is liquid glass.
- **Type.** A display serif for titles and big numbers (`font-display`), the interface grotesk for everything else, a figures face for times (`font-figures`, tabular). Scrambles are set in the grotesk at a medium weight, wide move spacing, a size well under the time.
- **The timer cover.** One tile holds the scramble headline (with the session, puzzle and inspection chips above it), the digits, the hold/ready meter, the line under a result ("+0.31 vs your ao5 · next ao5 2.10–2.44", or "First solve logged · 4 more for your ao5"), the penalty chips and a ruled row of AO5 / AO12 / BEST / MEAN. The cube preview sits in the cover's bottom-right corner; pointing at it shows its 3D/2D switch. Everything but the digits hides while a solve is held or timed. Ready is a clear dark-green wash under green digits.
- **After the solve.** A new best turns the digits gold, draws a gold line around the cover, bursts sparkles from the sides (never over the scramble), and says how much faster and what it beat. The Next target tile names a number to beat ("Beat 2.00 · 0.06 s to go"); past the last milestone it chases your best average.
- **The Hub.** Courses are covers (generative art per course); the path page is the Trail, a winding path of numbered stops with the current stop's card; units open on their own cover; lessons are a small pile of cards you flick through.

## Timer

- **Digits:** three styles — Clean (Geist Mono), LCD (DSEG7, with faint "ghost" segments like a real display) and Dot (Doto) — plus a size slider.
- **States:** holding shows a red hold meter that fills to green when armed; inspection shows an amber draining bar with 8 s/12 s marks; running hides everything but the digits; stopping gives a small spring "pop".
- **Live averages:** Ao5 and Ao12 under the digits (csTimer-style), rolling with NumberFlow.
- **Tiles:** Times (sortable by time/ao5/ao12, the best in gold, past bests dotted), and after five solves Trend, Next target and Today; before that, "Your first five". The cube preview (interactive 3D, or a flat net) lives on the cover.
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
