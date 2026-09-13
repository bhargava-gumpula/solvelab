# Design foundation

The timer is the home screen: no marketing page and no coaching gate. Graphite surfaces, bright neutral digits, a restrained orange accent and thin borders keep attention on solving; the cube's sticker colors are the only saturated color in the timer. Dark mode is the default and first-class; light and system modes are supported.

## Tokens and typography

All colors are CSS variables in `app/globals.css` (surfaces, text, accent, danger/success/warning, timer states, chart slots, cube stickers) exposed as Tailwind colors. Components never hard-code colors. Branding lives in `lib/config/brand.ts`.

Geist Sans for interface text and Geist Mono for timer digits, scrambles and numeric columns, self-hosted by `next/font`. Changing numbers use tabular figures to avoid layout shift; large standalone stat values use proportional figures.

## Timer states

| State               | Treatment                                                 |
| ------------------- | --------------------------------------------------------- |
| Idle / result       | Neutral digits showing the latest solve                   |
| Holding (not armed) | Red digits                                                |
| Armed               | Green digits — release to start                           |
| Inspection          | Amber countdown; "+2"/"DNF" past the limit; 8 s/12 s cues |
| Running             | The timer covers the viewport; everything else is hidden  |

Transitions are short opacity fades and respect `prefers-reduced-motion`.

## Charts

Charts follow the data-viz method: one y-axis, 2 px lines, thin rounded bars, hairline grids, legends for multi-series charts, a crosshair tooltip, and a table view for every chart. Each entity keeps one color everywhere (Ao5, Ao12, Ao100 use validated categorical slots; singles are neutral). The palette passed the CVD and normal-vision separation checks in both modes; the one light-mode slot below 3:1 contrast is backed by the legend and table view.

## 21st.dev source review

- Shell: [Sidebar by shadcn](https://21st.dev/@shadcn/components/sidebar) (MIT), adapted onto the installed shadcn Sidebar primitives with an icon-collapsible desktop rail and a bottom navigation bar on mobile.
- Stat tiles: patterned on the [21st.dev stat card collection](https://21st.dev/community/components/explore/stat-card) (label, value, context line), built with project tokens.

The 21st.dev registry requires an authenticated API key and no 21st MCP is connected, so components were adapted by hand rather than installed. Connecting the 21st.dev Magic MCP would allow direct installs in later phases. No second component library is installed; icons are Lucide.

## Accessibility

Skip link, semantic landmarks, visible focus rings, labeled controls, `aria-current` navigation, live-region timer announcements, dialogs with focus management (Radix), tables for chart data, and a keyboard guard that never takes Space from inputs, dialogs or keyboard-focused buttons.
