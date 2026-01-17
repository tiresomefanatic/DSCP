# Token Viewer Architecture

## Overview

The DSCP (Design System Control Panel) Token Viewer is a web application for viewing, managing, and editing design tokens. It implements the **Token Transformation Theory** which defines a layered token architecture:

```
Primitive (values) → Brand (semantic aliasing) → Core (component provenance) → Semantic (bindings)
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Global    │  │    Brand    │  │    Core     │   ← Tab Views   │
│  │  TokenGrid  │  │ TokenTable  │  │CoreTokenView│                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                │                │                         │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
│                    useTokens() hook                                 │
│                          │                                          │
│                    API Client (lib/api.ts)                          │
└──────────────────────────│──────────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────│──────────────────────────────────────────┐
│                          │                                          │
│                   Express API Server                                │
│                          │                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Token Routes                              │   │
│  │  GET /api/tokens     - List & resolve tokens                 │   │
│  │  GET /api/tokens/:id - Get single token                      │   │
│  │  POST /api/tokens    - Update token value                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│         ┌────────────────┴────────────────┐                        │
│         │                                 │                        │
│  ┌──────▼──────┐                  ┌───────▼───────┐                │
│  │ TokenParser │                  │ TokenResolver │                │
│  │  (parsing)  │                  │  (resolution) │                │
│  └─────────────┘                  └───────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                           │
                    Git Provider
                           │
              ┌────────────┴────────────┐
              │                         │
       GitHub Provider           Local Provider
              │                         │
       GitHub API              Local File System
```

---

## Monorepo Structure

```
dscp/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   └── src/
│   │       ├── features/
│   │       │   ├── token-viewer/    # Main token viewing UI
│   │       │   ├── token-editor/    # Token editing components
│   │       │   ├── editing/         # Edit mode management
│   │       │   ├── git-ui/          # Branch selector, PR UI
│   │       │   └── preview/         # Component preview panel
│   │       ├── hooks/               # React Query hooks
│   │       └── lib/                 # Store, API client, utils
│   │
│   └── api/                    # Express backend
│       └── src/
│           ├── routes/              # API endpoints
│           └── middleware/          # Git provider middleware
│
└── packages/
    ├── types/                  # Shared TypeScript types
    ├── token-resolver/         # Token parsing & resolution
    ├── git-provider/           # Git provider factory
    ├── git-provider-github/    # GitHub implementation
    └── git-provider-local/     # Local filesystem implementation
```

---

## Token Layer Architecture

### The Three Authored Layers

Following the Token Transformation Theory:

#### 1. **Global (Primitive) Layer**
Raw values with no semantic meaning.

```json
{
  "collection": "Global",
  "modes": ["Default"],
  "variables": {
    "color": {
      "blue": {
        "500": { "type": "color", "values": { "Default": "#3b82f6" } }
      }
    }
  }
}
```

- **Single mode**: `Default`
- **Token type**: `value` (string or number)
- **UI**: `TokenGrid` with color swatches grouped by palette

#### 2. **Brand Layer**
Semantic aliasing that assigns brand meaning to primitives.

```json
{
  "collection": "Brand",
  "modes": ["Light", "Dark"],
  "variables": {
    "acpd": {
      "color": {
        "content": {
          "primary": {
            "type": "color",
            "values": {
              "Light": "Global:color/gray/1200",
              "Dark": "Global:color/gray/100"
            }
          }
        }
      }
    }
  }
}
```

- **Two modes**: `Light`, `Dark` (theme modes)
- **Token type**: `values.light`, `values.dark`
- **UI**: `TokenTable` grouped by semantic category (content, background, border, etc.)

#### 3. **Core Layer**
Component-specific tokens with full provenance encoding.

```json
{
  "collection": "Core",
  "modes": ["ACPD", "EEAA"],
  "variables": {
    "action": {
      "button": {
        "bg": {
          "dark": {
            "primary-default": {
              "type": "color",
              "values": {
                "ACPD": "Brand:acpd/color/background/accent-light",
                "EEAA": "Brand:eeaa/color/background/accent-light"
              }
            }
          }
        }
      }
    }
  }
}
```

- **Two modes**: `ACPD`, `EEAA` (brand modes)
- **Token type**: `brandValues.acpd`, `brandValues.eeaa`
- **Path schema**: `{concept}/{component}/{property}/{prominence}/{meaning}-{state}`
- **UI**: `CoreTokenView` matrix showing property × prominence × meaning × state

---

## Token Resolution Chain

The resolver follows aliases through the layer hierarchy:

```
Core Token (brand=EEAA, mode=light)
    │
    │ brandValues.eeaa = "Brand:eeaa/color/background/accent-light"
    ▼
Brand Token (mode=light)
    │
    │ values.light = "Global:color/plum/400"
    ▼
Global Token
    │
    │ value = "#c266ff"
    ▼
Final Resolved Value: #c266ff
```

### Resolution Parameters

| Layer  | Resolved By | Parameters |
|--------|-------------|------------|
| Global | Direct value | None |
| Brand  | Theme mode | `mode: 'light' \| 'dark'` |
| Core   | Brand + Theme | `brand: 'acpd' \| 'eeaa'`, `mode: 'light' \| 'dark'` |

---

## Key Components

### Frontend Components

#### `TokenLayout.tsx`
Main layout with three tabs (Global, Brand, Core) and mode toggle.

```tsx
<TokenLayout>
  <Tabs>Global | Brand | Core</Tabs>
  <ModeToggle>Light | Dark | Both</ModeToggle>
  <CategorySidebar />
  <TokenContent />  // Routes to appropriate view
</TokenLayout>
```

#### `CategorySidebar.tsx`
Navigation sidebar that builds category trees based on active tab:

| Tab | Category Structure | Example |
|-----|-------------------|---------|
| Global | Type-based | color, spacing, radius, typography |
| Brand | Semantic | color → content, background, border |
| Core | Concept → Component | action → button, surface → card |

#### `TokenGrid.tsx`
Color swatch display for Global and Brand color tokens.
- Groups by palette (Global) or semantic category (Brand)
- Shows light/dark side-by-side in "Both" mode

#### `TokenTable.tsx`
Table view for non-color tokens (typography, spacing, etc.)
- Groups by subcategory for Brand tokens
- Shows light/dark columns based on mode

#### `CoreTokenView.tsx`
Matrix display for Core component tokens.
- Parses path: `{concept}/{component}/{property}/{prominence}/{meaning}-{state}`
- Rows: property × prominence × meaning
- Columns: state (default, hover, pressed)
- Cells: resolved color swatches

#### `TokenDetail.tsx`
Detail panel for selected token showing:
- Path, name, collection, type
- Raw value (alias reference)
- Resolved value
- Edit controls (when in edit mode)

### Backend Packages

#### `@dscp/types`
Shared TypeScript types:

```typescript
interface ResolvedToken {
  id: string;
  path: string;
  name: string;
  tier: 'global' | 'brand' | 'component';
  type: 'COLOR' | 'FLOAT' | 'STRING';
  brand: 'acpd' | 'eeaa' | null;
  collection: string;

  // Value storage (mutually exclusive)
  value?: string | number;              // Global tokens
  values?: { light?: ...; dark?: ... }; // Brand tokens
  brandValues?: { acpd?: ...; eeaa?: ... }; // Core tokens
}
```

#### `@dscp/token-resolver`

**TokenParser**: Transforms nested JSON into flat `ResolvedToken[]`
- Detects mode type (Default, Light/Dark, ACPD/EEAA)
- Extracts brand from path for Brand tokens
- Populates appropriate value field

**TokenResolver**: Resolves aliases and validates tokens
- `resolve(path, mode, brand)` - Follows alias chain to final value
- `resolveAll(brand, mode)` - Batch resolution for UI
- `validate()` - Checks for circular/missing references

#### `@dscp/git-provider`
Abstraction for reading/writing tokens from git repositories.

```typescript
interface GitProvider {
  readFile(params: { branch: string; path: string }): Promise<string>;
  writeFile(params: { branch: string; path: string; content: string; message: string }): Promise<Commit>;
  listBranches(): Promise<Branch[]>;
  createBranch(params: { name: string; from: string }): Promise<Branch>;
}
```

Implementations:
- `GitHubProvider`: Uses GitHub API (production)
- `LocalProvider`: Uses local filesystem (development)

---

## State Management

### Zustand Store (`lib/store.ts`)

```typescript
interface AppState {
  // Selection state
  selectedBranch: string;
  selectedBrand: 'acpd' | 'eeaa';
  selectedMode: 'light' | 'dark';
  selectedToken: ResolvedToken | null;

  // UI state
  activeTab: 'global' | 'brand' | 'core';
  viewMode: 'light' | 'dark' | 'both';
  selectedCategory: string | null;

  // Editing session
  editingSession: {
    isEditing: boolean;
    branchName: string | null;
    changesCount: number;
  };
}
```

### React Query Hooks

```typescript
// Fetch tokens with caching
useTokens() → { tokens, resolvedLight, resolvedDark, validation }

// Fetch branch list
useBranches() → Branch[]

// Mutation for token updates
useUpdateToken() → { mutate, isLoading, error }
```

---

## Data Flow

### Token Fetch Flow

```
1. User selects brand/mode in UI
2. useTokens() triggers API call
3. API reads tokens.json from git
4. TokenParser creates ResolvedToken[]
5. TokenResolver.resolveAll() resolves all aliases
6. Response: { tokens, resolvedLight, resolvedDark }
7. UI renders appropriate view (Grid/Table/CoreView)
```

### Token Edit Flow

```
1. User enters edit mode (creates branch)
2. User modifies token value in detail panel
3. useUpdateToken() sends POST to API
4. API updates tokens.json and commits
5. Cache invalidation triggers refresh
6. User can create PR when done
```

---

## Collections Reference

| Collection | Tier | Modes | Token Count | Description |
|------------|------|-------|-------------|-------------|
| Global | global | Default | ~426 | Raw color/spacing/typography values |
| Brand | brand | Light, Dark | ~222 | Semantic aliases per brand |
| Core | component | ACPD, EEAA | ~726 | Component-specific tokens |
| Semantic | component | ACPD, EEAA | ~93 | Final binding surface |
| Prominence | component | dark, light, stroke | ~27 | Visual style axis |
| InteractionState | component | default, hover, pressed | ~16 | State axis |
| Variant | component | primary, secondary, destructive | ~6 | Meaning axis |

---

## File References

### Frontend
- `apps/web/src/features/token-viewer/TokenLayout.tsx` - Main layout
- `apps/web/src/features/token-viewer/CategorySidebar.tsx` - Navigation
- `apps/web/src/features/token-viewer/TokenGrid.tsx` - Color swatches
- `apps/web/src/features/token-viewer/TokenTable.tsx` - Table view
- `apps/web/src/features/token-viewer/CoreTokenView.tsx` - Core matrix
- `apps/web/src/features/token-viewer/TokenDetail.tsx` - Token details
- `apps/web/src/lib/store.ts` - Zustand state
- `apps/web/src/hooks/useTokens.ts` - Data fetching

### Backend
- `apps/api/src/routes/tokens.ts` - Token API endpoints
- `packages/token-resolver/src/parser.ts` - JSON → ResolvedToken
- `packages/token-resolver/src/resolver.ts` - Alias resolution
- `packages/types/src/tokens.ts` - Type definitions

### Theory
- `docs/Token Transformation Theory.md` - Full design specification
