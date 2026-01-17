import { useMemo } from 'react';
import { Palette, Hash, Type, Move, Sparkles, Circle, Square, Layers } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { useAppStore, type ActiveTab } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';

// Define which collections belong to each tab
// Following Token Transformation Theory: Global (Primitives) → Brand (Semantic) → Core (Component)
const TAB_COLLECTIONS: Record<ActiveTab, string[]> = {
  global: ['Global'],
  brand: ['Brand'],
  core: [
    'Core', 'Semantic', 'Prominence', 'PositiveState', 'NegativeState',
    'Disabled', 'Icon', 'Motion', 'Elevation', 'Breakpoint', 'Size',
    'Typography', 'Roundness', 'ItemSpacing', 'InteractionState',
    'PositiveNegativeToggle', 'Variant'
  ],
};

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  color: <Palette className="h-4 w-4" />,
  spacing: <Move className="h-4 w-4" />,
  typography: <Type className="h-4 w-4" />,
  radius: <Circle className="h-4 w-4" />,
  shadow: <Square className="h-4 w-4" />,
  motion: <Sparkles className="h-4 w-4" />,
  opacity: <Layers className="h-4 w-4" />,
  default: <Hash className="h-4 w-4" />,
};

interface CategoryNode {
  name: string;
  path: string;
  children: CategoryNode[];
  tokenCount: number;
  isLeaf: boolean;
}

export function CategorySidebar() {
  const { data: tokensData } = useTokens();
  const { activeTab, selectedCategory, setSelectedCategory, selectedBrand } = useAppStore();

  // Build category tree based on active tab
  const categories = useMemo(() => {
    if (!tokensData?.tokens) return [];

    const collections = TAB_COLLECTIONS[activeTab];
    const tokens = tokensData.tokens.filter(t => collections.includes(t.collection));

    // For global, group by first path segment (color, spacing, etc.)
    if (activeTab === 'global') {
      return buildGlobalCategories(tokens);
    }

    // For brand tab, group by brand then semantic category
    if (activeTab === 'brand') {
      return buildBrandCategories(tokens, selectedBrand);
    }

    // For core, group by concept/component (action.button, surface.card, etc.)
    return buildCoreCategories(tokens);
  }, [tokensData?.tokens, activeTab, selectedBrand]);

  return (
    <div className="flex h-full flex-col">
      {/* Brand Selector for brand and core tabs */}
      {(activeTab === 'brand' || activeTab === 'core') && <BrandSelector />}

      {/* Categories */}
      <nav className="flex-1 overflow-auto py-2">
        {categories.map((category) => (
          <CategoryItem
            key={category.path}
            category={category}
            depth={0}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        ))}
      </nav>
    </div>
  );
}

function BrandSelector() {
  const { selectedBrand, setBrand } = useAppStore();

  return (
    <div className="border-b p-3">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Brand</label>
      <select
        value={selectedBrand}
        onChange={(e) => setBrand(e.target.value as 'acpd' | 'eeaa')}
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="acpd">ACPD</option>
        <option value="eeaa">EEAA</option>
      </select>
    </div>
  );
}

interface CategoryItemProps {
  category: CategoryNode;
  depth: number;
  selectedCategory: string | null;
  onSelect: (path: string) => void;
}

function CategoryItem({ category, depth, selectedCategory, onSelect }: CategoryItemProps) {
  const isSelected = selectedCategory === category.path;
  const hasChildren = category.children.length > 0;
  const icon = CATEGORY_ICONS[category.name.toLowerCase()] || CATEGORY_ICONS.default;

  return (
    <div>
      <button
        onClick={() => onSelect(category.path)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent ${
          isSelected ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <span className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
          {icon}
        </span>
        <span className="flex-1 truncate capitalize">{category.name}</span>
        <span className="text-xs text-muted-foreground">{category.tokenCount}</span>
      </button>
      {hasChildren && category.children.map((child) => (
        <CategoryItem
          key={child.path}
          category={child}
          depth={depth + 1}
          selectedCategory={selectedCategory}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// Build global (primitive) token categories
function buildGlobalCategories(tokens: ResolvedToken[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();

  for (const token of tokens) {
    const parts = token.path.split('/');
    if (parts.length < 1) continue;

    const topLevel = parts[0]; // color, spacing, etc.

    if (!categoryMap.has(topLevel)) {
      categoryMap.set(topLevel, {
        name: topLevel,
        path: `Global/${topLevel}`,
        children: [],
        tokenCount: 0,
        isLeaf: true,
      });
    }

    categoryMap.get(topLevel)!.tokenCount++;
  }

  // Sort categories in logical order
  const order = ['color', 'spacing', 'radius', 'shadow', 'typography', 'motion', 'opacity', 'toggle'];
  return Array.from(categoryMap.values()).sort((a, b) => {
    const aIdx = order.indexOf(a.name.toLowerCase());
    const bIdx = order.indexOf(b.name.toLowerCase());
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

// Build brand (semantic aliasing) categories
// Only top-level items (Color, Typography, etc.) - nested items shown in main content area
function buildBrandCategories(tokens: ResolvedToken[], brand: string): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();

  for (const token of tokens) {
    // Filter by selected brand
    if (token.brand && token.brand !== brand) {
      continue;
    }

    const parts = token.path.split('/');
    // Skip brand prefix if present (e.g., "acpd/color/content" -> "color/content")
    const startIdx = (parts[0]?.toLowerCase() === 'acpd' || parts[0]?.toLowerCase() === 'eeaa') ? 1 : 0;
    const topLevel = parts[startIdx] || parts[0]; // color, typography, etc.

    if (!categoryMap.has(topLevel)) {
      categoryMap.set(topLevel, {
        name: topLevel,
        path: `Brand/${brand}/${topLevel}`,
        children: [], // No nested children in sidebar - they show in main content
        tokenCount: 0,
        isLeaf: true, // Mark as leaf so no expand/collapse
      });
    }

    categoryMap.get(topLevel)!.tokenCount++;
  }

  // Sort with color first
  return Array.from(categoryMap.values()).sort((a, b) => {
    if (a.name.toLowerCase() === 'color') return -1;
    if (b.name.toLowerCase() === 'color') return 1;
    return a.name.localeCompare(b.name);
  });
}

// Build core (component provenance) categories
// Groups by concept (action, surface, input, feedback) then component (button, card, etc.)
function buildCoreCategories(tokens: ResolvedToken[]): CategoryNode[] {
  const conceptMap = new Map<string, CategoryNode>();

  for (const token of tokens) {
    const parts = token.path.split('/');
    if (parts.length < 1) continue;

    const concept = parts[0]; // action, surface, input, feedback, or component name

    if (!conceptMap.has(concept)) {
      conceptMap.set(concept, {
        name: concept,
        path: `${token.collection}/${concept}`,
        children: [],
        tokenCount: 0,
        isLeaf: false,
      });
    }

    const conceptNode = conceptMap.get(concept)!;
    conceptNode.tokenCount++;

    // Add component as subcategory (button, card, toast, etc.)
    if (parts.length >= 2) {
      const component = parts[1];
      let componentChild = conceptNode.children.find(c => c.name === component);

      if (!componentChild) {
        componentChild = {
          name: component,
          path: `${token.collection}/${concept}/${component}`,
          children: [],
          tokenCount: 0,
          isLeaf: true,
        };
        conceptNode.children.push(componentChild);
      }
      componentChild.tokenCount++;
    }
  }

  // Sort concepts in logical order based on Token Transformation Theory
  const conceptOrder = ['action', 'surface', 'input', 'feedback', 'navigation', 'layout'];
  return Array.from(conceptMap.values()).sort((a, b) => {
    const aIdx = conceptOrder.indexOf(a.name.toLowerCase());
    const bIdx = conceptOrder.indexOf(b.name.toLowerCase());
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}
