import { useMemo } from 'react';
import { Palette, Hash, Type, Move, Sparkles, Circle, Square, Layers } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { useAppStore, type ActiveTab } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';

// Define which collections belong to each tab
const TAB_COLLECTIONS: Record<ActiveTab, string[]> = {
  primitives: ['Global'],
  tokens: ['Brand', 'Core', 'Semantic'],
  components: [
    'Prominence', 'PositiveState', 'NegativeState', 'Disabled', 'Icon',
    'Motion', 'Elevation', 'Breakpoint', 'Size', 'Typography', 'Roundness',
    'ItemSpacing', 'InteractionState', 'PositiveNegativeToggle', 'Variant'
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

    // For primitives, group by first path segment (color, spacing, etc.)
    if (activeTab === 'primitives') {
      return buildPrimitiveCategories(tokens);
    }

    // For tokens tab, group by brand then category
    if (activeTab === 'tokens') {
      return buildTokenCategories(tokens, selectedBrand);
    }

    // For components, group by component name
    return buildComponentCategories(tokens);
  }, [tokensData?.tokens, activeTab, selectedBrand]);

  return (
    <div className="flex h-full flex-col">
      {/* Brand Selector for tokens tab */}
      {activeTab === 'tokens' && <BrandSelector />}

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

// Build primitive token categories (Global collection)
function buildPrimitiveCategories(tokens: ResolvedToken[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();

  for (const token of tokens) {
    const parts = token.path.split('/');
    if (parts.length < 1) continue;

    const topLevel = parts[0]; // color, spacing, etc.
    
    if (!categoryMap.has(topLevel)) {
      categoryMap.set(topLevel, {
        name: topLevel,
        path: `Global/${topLevel}`,
        children: [], // No nested children - keep sidebar flat
        tokenCount: 0,
        isLeaf: true,
      });
    }

    categoryMap.get(topLevel)!.tokenCount++;
  }

  // Sort categories
  const order = ['color', 'spacing', 'radius', 'shadow', 'typography', 'motion', 'opacity', 'toggle'];
  return Array.from(categoryMap.values()).sort((a, b) => {
    const aIdx = order.indexOf(a.name);
    const bIdx = order.indexOf(b.name);
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

// Build token categories (Brand, Core, Semantic)
function buildTokenCategories(tokens: ResolvedToken[], brand: string): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();

  for (const token of tokens) {
    // Filter by brand for Brand collection
    if (token.collection === 'Brand' && token.brand && token.brand !== brand) {
      continue;
    }

    const parts = token.path.split('/');
    const topLevel = parts[0]; // color, typography, etc.

    if (!categoryMap.has(topLevel)) {
      categoryMap.set(topLevel, {
        name: topLevel,
        path: `${token.collection}/${topLevel}`,
        children: [],
        tokenCount: 0,
        isLeaf: false,
      });
    }

    const category = categoryMap.get(topLevel)!;
    category.tokenCount++;

    // Add subcategory for semantic groupings (content, surface, border, overlay)
    if (parts.length >= 2) {
      const subName = parts[1];
      let subChild = category.children.find(c => c.name === subName);
      
      if (!subChild) {
        subChild = {
          name: subName,
          path: `${token.collection}/${topLevel}/${subName}`,
          children: [],
          tokenCount: 0,
          isLeaf: true,
        };
        category.children.push(subChild);
      }
      subChild.tokenCount++;
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Build component categories
function buildComponentCategories(tokens: ResolvedToken[]): CategoryNode[] {
  const componentMap = new Map<string, CategoryNode>();

  for (const token of tokens) {
    const parts = token.path.split('/');
    const componentName = parts[0]; // Button, Card, Alert, etc.

    if (!componentMap.has(componentName)) {
      componentMap.set(componentName, {
        name: componentName,
        path: `component/${componentName}`,
        children: [],
        tokenCount: 0,
        isLeaf: true,
      });
    }

    componentMap.get(componentName)!.tokenCount++;
  }

  return Array.from(componentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
