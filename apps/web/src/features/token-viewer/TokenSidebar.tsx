import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, Palette, Hash, Type, AlertTriangle, Folder, FolderOpen } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';

interface CollectionNode {
  name: string;
  children: Map<string, CollectionNode>;
  token?: ResolvedToken;
  isLeaf: boolean;
  fullPath: string;
}

/**
 * Build a tree structure from tokens grouped by collection
 * This preserves the exact JSON nesting structure
 */
function buildCollectionTree(tokens: ResolvedToken[]): Map<string, CollectionNode> {
  const collections = new Map<string, CollectionNode>();

  for (const token of tokens) {
    // Get or create collection node
    if (!collections.has(token.collection)) {
      collections.set(token.collection, {
        name: token.collection,
        children: new Map(),
        isLeaf: false,
        fullPath: token.collection,
      });
    }

    const collection = collections.get(token.collection)!;

    // Split the path and build nested structure
    const pathParts = token.path.split('/');
    let current = collection;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;
      const currentPath = `${token.collection}:${pathParts.slice(0, i + 1).join('/')}`;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          children: new Map(),
          isLeaf: isLast,
          token: isLast ? token : undefined,
          fullPath: currentPath,
        });
      } else if (isLast) {
        const existing = current.children.get(part)!;
        existing.isLeaf = true;
        existing.token = token;
      }

      current = current.children.get(part)!;
    }
  }

  return collections;
}

/**
 * Sort collections in a logical order
 */
function sortCollections(collections: Map<string, CollectionNode>): CollectionNode[] {
  const order = [
    'Global',
    'Brand',
    'Core',
    'Semantic',
    'Prominence',
    'PositiveState',
    'NegativeState',
    'PositiveNegativeToggle',
    'Disabled',
    'InteractionState',
    'Icon',
    'Typography',
    'Size',
    'Roundness',
    'ItemSpacing',
    'Motion',
    'Elevation',
    'Breakpoint',
    'Variant',
  ];

  const sorted: CollectionNode[] = [];

  // Add in predefined order
  for (const name of order) {
    if (collections.has(name)) {
      sorted.push(collections.get(name)!);
    }
  }

  // Add any remaining collections not in the order
  for (const [name, node] of collections) {
    if (!order.includes(name)) {
      sorted.push(node);
    }
  }

  return sorted;
}

export function TokenSidebar() {
  const [search, setSearch] = useState('');
  const { data: tokensData, isLoading, error } = useTokens();

  // Build collection-based tree structure
  const collectionTree = useMemo(() => {
    if (!tokensData?.tokens) return [];
    const tree = buildCollectionTree(tokensData.tokens);
    return sortCollections(tree);
  }, [tokensData?.tokens]);

  // Build a map of resolved values for quick lookup
  const resolvedMap = tokensData?.resolved || {};

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading tokens...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading tokens</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-3">
        <h2 className="font-semibold">Design Tokens</h2>
        <p className="text-xs text-muted-foreground">
          {tokensData?.tokens.length || 0} tokens in {collectionTree.length} collections
        </p>
      </div>

      {/* Brand/Mode Selector */}
      <div className="border-b p-3">
        <BrandModeSelector />
      </div>

      {/* Validation Errors */}
      {tokensData?.validation && !tokensData.validation.valid && (
        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3 text-sm text-yellow-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Validation Failed
          </div>
          <div className="mt-1 text-xs">
            {tokensData.validation.errors && tokensData.validation.errors.length > 0
              ? `${tokensData.validation.errors.length} errors found`
              : 'Unknown validation error'}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Collection Tree */}
      <div className="flex-1 overflow-auto">
        {collectionTree.map((collection) => (
          <CollectionFolder
            key={collection.name}
            node={collection}
            depth={0}
            searchQuery={search}
            resolvedMap={resolvedMap}
          />
        ))}
      </div>
    </div>
  );
}

function BrandModeSelector() {
  const { selectedBrand, setBrand, selectedMode, setMode } = useAppStore();

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => setBrand(e.target.value as 'acpd' | 'eeaa')}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="acpd">ACPD</option>
            <option value="eeaa">EEAA</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mode</label>
          <select
            value={selectedMode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
            className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: CollectionNode;
  depth: number;
  searchQuery: string;
  resolvedMap: Record<string, string | number | null>;
}

function CollectionFolder({ node, depth, searchQuery, resolvedMap }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0); // Collections start expanded
  const { setSelectedToken, selectedToken } = useAppStore();

  // Count tokens in this subtree
  const tokenCount = useMemo(() => countTokens(node), [node]);

  // Filter by search
  if (searchQuery) {
    const matches = matchesSearch(node, searchQuery);
    if (!matches) return null;
  }

  const isSelected = selectedToken?.path === node.token?.path && node.isLeaf;
  const sortedChildren = useMemo(() => {
    const children = Array.from(node.children.values());
    // Sort: folders first, then alphabetically
    return children.sort((a, b) => {
      if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [node.children]);

  // Leaf node (actual token)
  if (node.isLeaf && node.token) {
    const resolvedValue = resolvedMap[node.token.path];

    return (
      <button
        onClick={() => setSelectedToken(node.token!)}
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/50 ${
          isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground'
        }`}
      >
        <TokenPreview token={node.token} resolvedValue={resolvedValue} />
        <span className="flex-1 truncate">{node.name}</span>
        <TokenTypeIcon type={node.token.type} />
      </button>
    );
  }

  // Folder node (collection or path segment)
  const isCollection = depth === 0;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/50 ${
          isCollection ? 'font-medium text-foreground' : 'text-foreground'
        }`}
      >
        {expanded ? (
          isCollection ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" />
          )
        ) : (
          isCollection ? (
            <Folder className="h-4 w-4 shrink-0 text-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )
        )}
        <span className="truncate">{node.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground/70">
          {tokenCount}
        </span>
      </button>
      {expanded && sortedChildren.length > 0 && (
        <div className="ml-[19px] border-l border-border/50 pl-1">
          {sortedChildren.map((child) => (
            <CollectionFolder
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              resolvedMap={resolvedMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TokenPreview({ token, resolvedValue }: { token: ResolvedToken; resolvedValue: string | number | null | undefined }) {
  if (token.type === 'COLOR') {
    const displayColor = typeof resolvedValue === 'string' ? resolvedValue : null;

    if (displayColor && (displayColor.startsWith('#') || displayColor.startsWith('rgb'))) {
      return (
        <div
          className="h-4 w-4 shrink-0 rounded border shadow-sm"
          style={{ backgroundColor: displayColor }}
          title={displayColor}
        />
      );
    }
    // Fallback: show placeholder for unresolved colors
    return (
      <div className="h-4 w-4 shrink-0 rounded border bg-gradient-to-br from-gray-200 to-gray-300" title="Unresolved" />
    );
  }

  if (token.type === 'FLOAT') {
    return (
      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-gray-100 text-[8px] font-mono">
        {typeof resolvedValue === 'number' ? (resolvedValue > 99 ? '...' : resolvedValue) : '#'}
      </div>
    );
  }

  return <div className="h-4 w-4 shrink-0" />;
}

function TokenTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'COLOR':
      return <Palette className="h-3 w-3 text-muted-foreground" />;
    case 'FLOAT':
      return <Hash className="h-3 w-3 text-muted-foreground" />;
    case 'STRING':
      return <Type className="h-3 w-3 text-muted-foreground" />;
    default:
      return null;
  }
}

function countTokens(node: CollectionNode): number {
  if (node.isLeaf) return 1;
  let count = 0;
  for (const child of node.children.values()) {
    count += countTokens(child);
  }
  return count;
}

function matchesSearch(node: CollectionNode, query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Check if this node matches
  if (node.name.toLowerCase().includes(lowerQuery)) return true;
  if (node.token?.path.toLowerCase().includes(lowerQuery)) return true;

  // Check if any children match
  for (const child of node.children.values()) {
    if (matchesSearch(child, lowerQuery)) return true;
  }

  return false;
}
