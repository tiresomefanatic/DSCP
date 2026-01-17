# Token View Architecture

## Document Purpose

This document defines the UI view architecture for the DSCP Token Viewer. It specifies:
- What views are needed for each token layer
- How browse mode differs from edit mode
- How to visualize Core tokens with headless component previews
- The complete view taxonomy across all layers (authored + generated)

This document should be read alongside:
- `TOKEN-VIEWER-ARCHITECTURE.md` — system architecture and data flow
- `Token Transformation Theory.md` — the conceptual model for token layers

---

## Design Principles

### 1. Separate Browse and Edit Experiences

The UI must support two distinct modes:

| Mode | Optimized For | Characteristics |
|------|---------------|-----------------|
| **Browse Mode** | Scanning, comparison, discovery | Dense information display, read-only, visual emphasis |
| **Edit Mode** | Precise value manipulation | Focused single-token editing, validation, live preview |

**Rationale:** Attempting to serve both use cases in a single UI compromises both experiences. Browse mode needs density and overview; Edit mode needs focus and safety.

### 2. All Layers Are Viewable

Every layer in the token pipeline should have its own view:
- **Authored layers:** Primitive, Brand, Core
- **Generated layers:** Prominence, InteractionState, Variant, Semantic

Users should be able to navigate the full transformation pipeline and understand how tokens flow from raw values to final bindings.

### 3. Core Tokens Need Headless Component Previews

Core tokens encode component-level decisions. Viewing them as a data matrix is insufficient. The UI should render **live mini-components** showing how tokens apply to actual UI elements.

---

## Token Layer Reference

| Layer | Type | Modes | Groups By | Value Points To |
|-------|------|-------|-----------|-----------------|
| Primitive | authored | Default | type (color, spacing, radius, typography) | raw value |
| Brand | authored | Light, Dark | semantic role (content, background, border) | Primitive |
| Core | authored | ACPD, EEAA | concept → component → property | Brand |
| Prominence | generated | dark, light, stroke | component → meaning → state | Core |
| InteractionState | generated | default, hover, pressed | component → meaning | Prominence |
| Variant | generated | primary, secondary, destructive | component | InteractionState |
| Semantic | generated | (none) | component | Variant |

---

## View Specifications by Layer

### 1. Primitive Layer Views

Primitive tokens are raw values with no semantic meaning. Views should emphasize the value palette.

#### 1.1 Color Palette Grid

**Purpose:** Display all color primitives as swatches grouped by hue family.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMITIVE > COLOR                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Blue                                                           │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐ │
│  │ 50  │ 100 │ 200 │ 300 │ 400 │ 500 │ 600 │ 700 │ 800 │ 900 │ │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘ │
│                                                                 │
│  Gray                                                           │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐ │
│  │ 50  │ 100 │ 200 │ 300 │ 400 │ 500 │ 600 │ 700 │ 800 │ 900 │ │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘ │
│                                                                 │
│  Red                                                            │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐ │
│  │ 50  │ 100 │ 200 │ 300 │ 400 │ 500 │ 600 │ 700 │ 800 │ 900 │ │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Hover: Show hex value, token path
- Click: Open detail panel with full token info

#### 1.2 Scale View (Spacing, Radius)

**Purpose:** Display numeric scales as visual rulers showing relative proportions.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMITIVE > SPACING                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0   ▸                                           0px            │
│  1   ▸▸                                          4px            │
│  2   ▸▸▸▸                                        8px            │
│  3   ▸▸▸▸▸▸                                      12px           │
│  4   ▸▸▸▸▸▸▸▸                                    16px           │
│  5   ▸▸▸▸▸▸▸▸▸▸▸▸                                24px           │
│  6   ▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸                            32px           │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Visual treatment:**
- Bar length proportional to value
- Grid lines for easy comparison

#### 1.3 Typography Specimens

**Purpose:** Display typography tokens as rendered sample text.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMITIVE > TYPOGRAPHY                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  display-lg                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  The quick brown fox jumps                               │   │
│  │  48px / 56px / 600                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  heading-md                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  The quick brown fox jumps over the lazy dog             │   │
│  │  24px / 32px / 600                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  body-sm                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  The quick brown fox jumps over the lazy dog             │   │
│  │  14px / 20px / 400                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Brand Layer Views

Brand tokens assign semantic meaning to primitives. Views should emphasize the semantic groupings and theme modes.

#### 2.1 Semantic Grid

**Purpose:** Display Brand tokens grouped by semantic role, with Light/Dark modes visible.

```
┌─────────────────────────────────────────────────────────────────┐
│  BRAND > COLOR                        [Light] [Dark] [Both]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Content                                                        │
│  ┌──────────────────┬────────────┬────────────┐                │
│  │ Token            │   Light    │    Dark    │                │
│  ├──────────────────┼────────────┼────────────┤                │
│  │ primary          │ ■ #1a1a1a  │ ■ #ffffff  │                │
│  │ secondary        │ ■ #666666  │ ■ #a3a3a3  │                │
│  │ tertiary         │ ■ #999999  │ ■ #737373  │                │
│  │ accent           │ ■ #2563eb  │ ■ #60a5fa  │                │
│  │ danger           │ ■ #dc2626  │ ■ #f87171  │                │
│  └──────────────────┴────────────┴────────────┘                │
│                                                                 │
│  Background                                                     │
│  ┌──────────────────┬────────────┬────────────┐                │
│  │ Token            │   Light    │    Dark    │                │
│  ├──────────────────┼────────────┼────────────┤                │
│  │ primary          │ ■ #ffffff  │ ■ #0a0a0a  │                │
│  │ secondary        │ ■ #f5f5f5  │ ■ #171717  │                │
│  │ accent           │ ■ #eff6ff  │ ■ #1e3a5f  │                │
│  └──────────────────┴────────────┴────────────┘                │
│                                                                 │
│  Border                                                         │
│  ┌──────────────────┬────────────┬────────────┐                │
│  │ ...              │            │            │                │
│  └──────────────────┴────────────┴────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Mode toggle behavior:**
- `Light`: Show only Light column
- `Dark`: Show only Dark column
- `Both`: Show both columns side-by-side (default for comparison)

#### 2.2 Theme Comparison View

**Purpose:** Visual diff between Light and Dark modes for a selected semantic category.

```
┌─────────────────────────────────────────────────────────────────┐
│  BRAND > THEME COMPARISON > Content                             │
├────────────────────────────┬────────────────────────────────────┤
│         LIGHT              │              DARK                  │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│   primary    ■ #1a1a1a     │    primary    ■ #ffffff            │
│              ↓             │               ↓                    │
│   gray.1200                │    gray.50                         │
│                            │                                    │
│   secondary  ■ #666666     │    secondary  ■ #a3a3a3            │
│              ↓             │               ↓                    │
│   gray.600                 │    gray.400                        │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

#### 2.3 Alias Inspector

**Purpose:** Show the resolution chain for a selected Brand token.

```
┌─────────────────────────────────────────────────────────────────┐
│  ALIAS INSPECTOR                                                │
│  brand.color.content.primary (Light mode)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  brand.color.content.primary                                    │
│       │                                                         │
│       │ values.light = "primitive.color.gray.1200"              │
│       ▼                                                         │
│  primitive.color.gray.1200                                      │
│       │                                                         │
│       │ value = "#1a1a1a"                                       │
│       ▼                                                         │
│  ┌─────────┐                                                    │
│  │ #1a1a1a │  Final resolved value                              │
│  └─────────┘                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Core Layer Views

Core tokens encode full component provenance. Views must handle the multi-dimensional nature of Core nomenclature.

#### Core Token Path Schema (Reference)

```
core.{concept}.{component}.{property}.{prominence}.{meaning}.{state}
```

- **concept**: action, surface, input, feedback
- **component**: button, card, input, toast, ...
- **property**: bg, text, border, ...
- **prominence**: dark, light, stroke
- **meaning**: primary, secondary, destructive, ...
- **state**: default, hover, pressed, disabled, ...

#### 3.1 Component Matrix with Headless Previews

**Purpose:** Display Core tokens as a matrix with live component previews in each cell.

```
┌─────────────────────────────────────────────────────────────────┐
│  CORE > ACTION > BUTTON                   Brand: [ACPD] [EEAA]  │
│                                           Theme: [Light] [Dark] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┬──────────┬──────────┬──────────┬────────┐│
│  │                  │ default  │  hover   │ pressed  │disabled││
│  ├──────────────────┼──────────┼──────────┼──────────┼────────┤│
│  │ dark.primary     │ [Button] │ [Button] │ [Button] │[Button]││
│  │                  │          │          │          │        ││
│  ├──────────────────┼──────────┼──────────┼──────────┼────────┤│
│  │ dark.secondary   │ [Button] │ [Button] │ [Button] │[Button]││
│  │                  │          │          │          │        ││
│  ├──────────────────┼──────────┼──────────┼──────────┼────────┤│
│  │ dark.destructive │ [Button] │ [Button] │ [Button] │[Button]││
│  │                  │          │          │          │        ││
│  ├──────────────────┼──────────┼──────────┼──────────┼────────┤│
│  │ light.primary    │ [Button] │ [Button] │ [Button] │[Button]││
│  │                  │          │          │          │        ││
│  ├──────────────────┼──────────┼──────────┼──────────┼────────┤│
│  │ light.secondary  │ [Button] │ [Button] │ [Button] │[Button]││
│  │                  │          │          │          │        ││
│  ├──────────────────┼──────────┼──────────┼──────────┼────────┤│
│  │ stroke.primary   │ [Button] │ [Button] │ [Button] │[Button]││
│  │                  │          │          │          │        ││
│  └──────────────────┴──────────┴──────────┴──────────┴────────┘│
│                                                                 │
│  Legend:                                                        │
│  Row = {prominence}.{meaning}                                   │
│  Column = {state}                                               │
│  Each cell = headless component preview with tokens applied     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Headless Component Preview Specification:**

Each `[Button]` cell is a live render:
- Applies `bg`, `text`, `border` tokens for that coordinate
- Sized small but legible (e.g., 80x32px for button)
- Shows actual component appearance

**Interactions:**
- Hover cell: Tooltip showing all token paths and resolved values
- Click cell: Open detail panel with full token info + edit capability

#### 3.2 Cell Detail Expansion

**Purpose:** Expanded view showing all properties for a single matrix cell.

```
┌─────────────────────────────────────────────────────────────────┐
│  CELL DETAIL: dark.primary.hover                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Preview                                                        │
│  ┌─────────────────────┐                                        │
│  │      [Button]       │  ← Larger preview (120x48px)           │
│  └─────────────────────┘                                        │
│                                                                 │
│  Properties                                                     │
│  ┌──────────┬─────────────────────────────────┬───────────┐    │
│  │ Property │ Token Path                      │ Resolved  │    │
│  ├──────────┼─────────────────────────────────┼───────────┤    │
│  │ bg       │ core.action.button.bg.dark...   │ ■ #1d4ed8 │    │
│  │ text     │ core.action.button.text.dark... │ ■ #ffffff │    │
│  │ border   │ core.action.button.border...    │ ■ #1d4ed8 │    │
│  └──────────┴─────────────────────────────────┴───────────┘    │
│                                                                 │
│  Click any row to inspect full resolution chain                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3 Provenance Tree View

**Purpose:** Full resolution chain from Core down to Primitive.

```
┌─────────────────────────────────────────────────────────────────┐
│  PROVENANCE: core.action.button.bg.dark.primary.hover           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CORE (authored)                                                │
│  └─ core.action.button.bg.dark.primary.hover                    │
│        │                                                        │
│        │ brandValues.acpd = "brand.acpd.color.background.accent"│
│        ▼                                                        │
│  BRAND (authored)                                               │
│  └─ brand.acpd.color.background.accent                          │
│        │                                                        │
│        │ values.light = "primitive.color.blue.600"              │
│        ▼                                                        │
│  PRIMITIVE (authored)                                           │
│  └─ primitive.color.blue.600                                    │
│        │                                                        │
│        │ value = "#2563eb"                                      │
│        ▼                                                        │
│  ┌───────────┐                                                  │
│  │  #2563eb  │  Final value                                     │
│  └───────────┘                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Generated Layer Views

Generated layers (Prominence, InteractionState, Variant, Semantic) are produced by the transformer. Views should show the sliced structure with modes as columns.

#### 4.1 Mode Column View (All Generated Layers)

**Purpose:** Table view where each mode becomes a column, matching Figma variables UX.

**Prominence Layer:**

```
┌─────────────────────────────────────────────────────────────────┐
│  PROMINENCE > BUTTON                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┬────────┬────────┬────────┐        │
│  │ Token                   │  dark  │ light  │ stroke │        │
│  ├─────────────────────────┼────────┼────────┼────────┤        │
│  │ primary.default.bg      │   ↩︎    │   ↩︎    │   ↩︎    │        │
│  │ primary.default.text    │   ↩︎    │   ↩︎    │   ↩︎    │        │
│  │ primary.default.border  │   ↩︎    │   ↩︎    │   ↩︎    │        │
│  │ primary.hover.bg        │   ↩︎    │   ↩︎    │   ↩︎    │        │
│  │ primary.hover.text      │   ↩︎    │   ↩︎    │   ↩︎    │        │
│  │ ...                     │        │        │        │        │
│  └─────────────────────────┴────────┴────────┴────────┘        │
│                                                                 │
│  ↩︎ = backreference to Core token                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**InteractionState Layer:**

```
┌─────────────────────────────────────────────────────────────────┐
│  INTERACTIONSTATE > BUTTON                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┬─────────┬────────┬─────────┐      │
│  │ Token                   │ default │ hover  │ pressed │      │
│  ├─────────────────────────┼─────────┼────────┼─────────┤      │
│  │ primary.bg              │    ↩︎    │   ↩︎    │    ↩︎    │      │
│  │ primary.text            │    ↩︎    │   ↩︎    │    ↩︎    │      │
│  │ primary.border          │    ↩︎    │   ↩︎    │    ↩︎    │      │
│  │ secondary.bg            │    ↩︎    │   ↩︎    │    ↩︎    │      │
│  │ ...                     │         │        │         │      │
│  └─────────────────────────┴─────────┴────────┴─────────┘      │
│                                                                 │
│  ↩︎ = backreference to Prominence token                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Variant Layer:**

```
┌─────────────────────────────────────────────────────────────────┐
│  VARIANT > BUTTON                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┬─────────┬───────────┬─────────────┐│
│  │ Token                   │ primary │ secondary │ destructive ││
│  ├─────────────────────────┼─────────┼───────────┼─────────────┤│
│  │ bg                      │    ↩︎    │     ↩︎     │      ↩︎      ││
│  │ text                    │    ↩︎    │     ↩︎     │      ↩︎      ││
│  │ border                  │    ↩︎    │     ↩︎     │      ↩︎      ││
│  └─────────────────────────┴─────────┴───────────┴─────────────┘│
│                                                                 │
│  ↩︎ = backreference to InteractionState token                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Slice Navigator

**Purpose:** Visual stepper showing the transformation pipeline.

```
┌─────────────────────────────────────────────────────────────────┐
│  SLICE NAVIGATOR                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────┐    ┌────────────┐    ┌──────────────────┐          │
│  │  Core  │ →  │ Prominence │ →  │ InteractionState │ →        │
│  │ (auth) │    │   (gen)    │    │      (gen)       │          │
│  └────────┘    └────────────┘    └──────────────────┘          │
│      ↓              ↓                    ↓                      │
│  6 axes        3 modes:            3 modes:                     │
│  collapsed     dark/light/stroke   default/hover/pressed        │
│                                                                 │
│       ┌─────────┐    ┌──────────┐                              │
│    →  │ Variant │ →  │ Semantic │                              │
│       │  (gen)  │    │  (gen)   │                              │
│       └─────────┘    └──────────┘                              │
│            ↓              ↓                                     │
│       3 modes:       no modes                                   │
│       pri/sec/dest   (binding surface)                          │
│                                                                 │
│  Click any step to view that layer                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Semantic Layer Views

Semantic is the final binding surface consumed by designers and developers.

#### 5.1 Binding Surface View

**Purpose:** Minimal property list per component — what developers actually use.

```
┌─────────────────────────────────────────────────────────────────┐
│  SEMANTIC                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Button                                                         │
│  ┌──────────────────┬─────────────────────────────────────────┐│
│  │ Property         │ Binding                                  ││
│  ├──────────────────┼─────────────────────────────────────────┤│
│  │ semantic.button.bg     │ → variant.button.bg               ││
│  │ semantic.button.text   │ → variant.button.text             ││
│  │ semantic.button.border │ → variant.button.border           ││
│  └──────────────────┴─────────────────────────────────────────┘│
│                                                                 │
│  Card                                                           │
│  ┌──────────────────┬─────────────────────────────────────────┐│
│  │ Property         │ Binding                                  ││
│  ├──────────────────┼─────────────────────────────────────────┤│
│  │ semantic.card.bg       │ → variant.card.bg                 ││
│  │ semantic.card.border   │ → variant.card.border             ││
│  └──────────────────┴─────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2 Full Resolution View

**Purpose:** Click to expand and see the entire chain from Semantic to Primitive.

```
┌─────────────────────────────────────────────────────────────────┐
│  SEMANTIC > BUTTON > BG                                         │
│  Full Resolution (Brand: ACPD, Theme: Light, Variant: Primary,  │
│                   State: Default, Prominence: Dark)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  semantic.button.bg                                             │
│       ↓                                                         │
│  variant.button.bg [primary]                                    │
│       ↓                                                         │
│  interactionstate.button.primary.bg [default]                   │
│       ↓                                                         │
│  prominence.button.primary.default.bg [dark]                    │
│       ↓                                                         │
│  core.action.button.bg.dark.primary.default                     │
│       ↓                                                         │
│  brand.acpd.color.background.accent                             │
│       ↓                                                         │
│  primitive.color.blue.600                                       │
│       ↓                                                         │
│  ┌───────────┐                                                  │
│  │  #2563eb  │                                                  │
│  └───────────┘                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3 Component Catalog View

**Purpose:** Group all semantic tokens by component for quick reference.

```
┌─────────────────────────────────────────────────────────────────┐
│  SEMANTIC CATALOG                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BUTTON              [Preview: Button]                   │   │
│  │  ├─ bg                                                   │   │
│  │  ├─ text                                                 │   │
│  │  └─ border                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CARD                [Preview: Card]                     │   │
│  │  ├─ bg                                                   │   │
│  │  └─ border                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  INPUT               [Preview: Input]                    │   │
│  │  ├─ bg                                                   │   │
│  │  ├─ text                                                 │   │
│  │  ├─ placeholder                                          │   │
│  │  └─ border                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edit Mode Specification

Edit mode is a separate experience optimized for precise value manipulation.

### Entry Points

Edit mode can be entered from:
1. Token detail panel "Edit" button
2. Matrix cell context menu
3. Global "Enter Edit Mode" action (creates branch)

### Edit Mode UI

```
┌─────────────────────────────────────────────────────────────────┐
│  EDIT MODE                                    [Exit Edit Mode]  │
│  Branch: feature/update-button-colors                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Editing: core.action.button.bg.dark.primary.hover              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Current Value                                           │   │
│  │  brand.acpd.color.background.accent-dark                 │   │
│  │                                            [Copy Path]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Select New Value                                        │   │
│  │  Filter: [background____________] [Clear]                │   │
│  │                                                          │   │
│  │  ○ brand.acpd.color.background.accent                    │   │
│  │  ● brand.acpd.color.background.accent-dark   ← current   │   │
│  │  ○ brand.acpd.color.background.accent-light              │   │
│  │  ○ brand.acpd.color.background.primary                   │   │
│  │  ○ brand.acpd.color.background.secondary                 │   │
│  │                                                          │   │
│  │  Showing Brand tokens compatible with this Core token    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Live Preview                                            │   │
│  │                                                          │   │
│  │  Before              After                               │   │
│  │  ┌────────────┐      ┌────────────┐                     │   │
│  │  │  [Button]  │  →   │  [Button]  │                     │   │
│  │  └────────────┘      └────────────┘                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                          [Apply to Branch]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Edit Mode Features

1. **Branch-based editing**: All changes happen on a branch, not main
2. **Token picker**: Filtered list of valid target tokens (respects layer hierarchy)
3. **Live preview**: Before/after comparison with headless component
4. **Batch editing**: Queue multiple changes before committing
5. **Validation**: Warns about circular references or type mismatches

### Edit Mode Constraints

| Layer | Editable? | What Can Be Changed |
|-------|-----------|---------------------|
| Primitive | Yes | Raw values (hex, numbers) |
| Brand | Yes | Alias target (must point to Primitive) |
| Core | Yes | Alias target (must point to Brand) |
| Generated | No | Read-only (regenerated from Core) |

---

## Navigation Structure

### Top-Level Tabs

```
┌─────────────────────────────────────────────────────────────────┐
│  [Primitive] [Brand] [Core] [Generated ▼] [Semantic]            │
│                              └─ Prominence                      │
│                              └─ InteractionState                │
│                              └─ Variant                         │
└─────────────────────────────────────────────────────────────────┘
```

### Sidebar Navigation

Each tab has its own sidebar structure:

**Primitive:**
- Color
- Spacing
- Radius
- Typography
- Motion

**Brand:**
- Color → Content, Background, Border, Accent
- Typography
- Spacing

**Core:**
- Action → Button, Link, IconButton
- Surface → Card, Dialog, Popover
- Input → TextField, Select, Checkbox
- Feedback → Toast, Alert, Badge

**Generated (all):**
- Same component grouping as Core

**Semantic:**
- Component catalog (Button, Card, Input, etc.)

---

## Global Controls

### Mode Selectors

```
┌─────────────────────────────────────────────────────────────────┐
│  Brand: [ACPD ▼]    Theme: [Light] [Dark] [Both]                │
└─────────────────────────────────────────────────────────────────┘
```

- **Brand selector**: Switches between brand modes (ACPD, EEAA)
- **Theme toggle**: Switches between Light/Dark, or shows both for comparison

### Search

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Search tokens...                                [⌘K]        │
└─────────────────────────────────────────────────────────────────┘
```

- Global search across all layers
- Results grouped by layer
- Supports path search (e.g., `button.bg`) and value search (e.g., `#2563eb`)

---

## Headless Component Registry

For Core layer visualization, the system needs a registry of headless components.

### Component Interface

```typescript
interface HeadlessComponent {
  // Component identifier matching Core nomenclature
  concept: 'action' | 'surface' | 'input' | 'feedback';
  component: string; // 'button', 'card', 'input', etc.

  // Render function
  render: (tokens: ResolvedTokens, state: ComponentState) => ReactNode;

  // Token mapping
  tokenProperties: string[]; // ['bg', 'text', 'border', ...]

  // Preview sizing
  previewSize: { width: number; height: number };
}
```

### Registry Example

```typescript
const headlessRegistry: HeadlessComponent[] = [
  {
    concept: 'action',
    component: 'button',
    render: (tokens, state) => (
      <button
        style={{
          backgroundColor: tokens.bg,
          color: tokens.text,
          borderColor: tokens.border,
        }}
        data-state={state}
      >
        Button
      </button>
    ),
    tokenProperties: ['bg', 'text', 'border'],
    previewSize: { width: 80, height: 32 },
  },
  {
    concept: 'surface',
    component: 'card',
    render: (tokens, state) => (
      <div
        style={{
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
        }}
      >
        Card
      </div>
    ),
    tokenProperties: ['bg', 'border'],
    previewSize: { width: 120, height: 80 },
  },
  // ... more components
];
```

---

## Implementation Notes

### View Component Mapping

| View | Component File | Priority |
|------|---------------|----------|
| Primitive Color Palette | `PrimitiveColorGrid.tsx` | P0 |
| Primitive Scale | `PrimitiveScaleView.tsx` | P1 |
| Primitive Typography | `PrimitiveTypographyView.tsx` | P1 |
| Brand Semantic Grid | `BrandSemanticGrid.tsx` | P0 |
| Brand Theme Comparison | `BrandThemeComparison.tsx` | P2 |
| Brand Alias Inspector | `AliasInspector.tsx` | P1 |
| Core Component Matrix | `CoreComponentMatrix.tsx` | P0 |
| Core Cell Detail | `CoreCellDetail.tsx` | P0 |
| Core Provenance Tree | `ProvenanceTree.tsx` | P1 |
| Generated Mode Columns | `GeneratedModeView.tsx` | P1 |
| Generated Slice Navigator | `SliceNavigator.tsx` | P2 |
| Semantic Binding Surface | `SemanticBindingView.tsx` | P0 |
| Semantic Full Resolution | `SemanticResolutionView.tsx` | P1 |
| Semantic Component Catalog | `SemanticCatalog.tsx` | P1 |
| Edit Mode Panel | `EditModePanel.tsx` | P0 |
| Headless Button | `HeadlessButton.tsx` | P0 |
| Headless Card | `HeadlessCard.tsx` | P1 |

### Data Requirements

Each view needs:
1. **Token data**: From `useTokens()` hook
2. **Resolution data**: Pre-resolved values for current brand/mode
3. **Validation data**: Circular reference checks, missing alias warnings

### State Requirements

```typescript
interface ViewState {
  // Global
  activeBrand: 'acpd' | 'eeaa';
  activeTheme: 'light' | 'dark' | 'both';

  // Navigation
  activeLayer: 'primitive' | 'brand' | 'core' | 'prominence' | 'interactionstate' | 'variant' | 'semantic';
  activeCategory: string | null;

  // Selection
  selectedToken: ResolvedToken | null;
  selectedCell: { prominence: string; meaning: string; state: string } | null;

  // Edit mode
  isEditing: boolean;
  editBranch: string | null;
  pendingChanges: TokenChange[];
}
```

---

## Summary

This document defines:

1. **7 layer types** with distinct view requirements
2. **Browse vs Edit mode** as separate experiences
3. **Headless component previews** for Core layer visualization
4. **Mode column views** for generated layers (Figma-like)
5. **Resolution chain views** for understanding token provenance
6. **Navigation structure** with tabs, sidebar, and global controls
7. **Component registry** for headless preview rendering

The implementation should prioritize P0 views first:
- Primitive Color Grid
- Brand Semantic Grid
- Core Component Matrix + Cell Detail
- Semantic Binding View
- Edit Mode Panel
- Headless Button component
