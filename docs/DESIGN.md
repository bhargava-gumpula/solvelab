# Design foundation

The main working surface is the timer, with no marketing page or coaching gate. Graphite surfaces, bright neutral digits, a restrained orange accent, thin borders, and generous timing space keep attention on solving. All palette values are centralized in app/globals.css; branding is centralized in lib/config/brand.ts.

## 21st.dev source review

Reviewed the [21st shadcn sidebar collection](https://21st.dev/community/components/explore/shadcn-sidebar) and selected [Sidebar by shadcn](https://21st.dev/@shadcn/components/sidebar), listed under the MIT license. The shell adapts this composition using the already installed shadcn Sidebar primitives, preserving one component system. No separate overlapping component package is installed. Custom timer layout is product-specific. Existing shadcn Empty, Tabs, Button, Select, and other primitives are reused when applicable.

No external image assets or fonts are needed for this utilitarian workspace. Icons are from the existing Lucide package. Future case diagrams must be computed from cube state rather than decorative illustrations.

## Phase boundary

V0 is a working navigation/theme/storage foundation, not an operational timer or diagnostic product. Any example scramble is explicitly labeled. Empty metrics never imply measurements. Later pages communicate the planned workflow and implementation phase rather than presenting fictional personal conclusions.
