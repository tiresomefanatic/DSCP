import { useMemo, Fragment } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';

interface TokenGroup {
  name: string;
  tokens: ResolvedToken[];
}

export function TokenTable() {
  const { data: tokensData } = useTokens();
  const { selectedCategory, viewMode, setSelectedToken, activeTab, selectedBrand } = useAppStore();

  // Get tokens for selected category
  const tokens = useMemo(() => {
    if (!tokensData?.tokens || !selectedCategory) return [];

    // Handle component categories
    if (selectedCategory.startsWith('component/')) {
      const componentName = selectedCategory.split('/')[1];
      if (!componentName) return [];
      // Filter tokens where the path starts with the component name
      // e.g. "Button/primary/..." starts with "Button"
      return tokensData.tokens.filter(token => token.path.startsWith(componentName));
    }

    return tokensData.tokens.filter(token => {
      const tokenPath = `${token.collection}/${token.path}`;
      return tokenPath.startsWith(selectedCategory) ||
             `Global/${token.path}`.startsWith(selectedCategory);
    });
  }, [tokensData?.tokens, selectedCategory]);

  // Group tokens by subcategory for Brand tab
  const tokenGroups = useMemo((): TokenGroup[] => {
    if (activeTab !== 'brand' || tokens.length === 0) {
      return [{ name: '', tokens }];
    }

    const groupMap = new Map<string, ResolvedToken[]>();

    for (const token of tokens) {
      const parts = token.path.split('/');
      // Skip brand prefix if present (e.g., "acpd/color/content/primary" -> "content")
      const startIdx = (parts[0]?.toLowerCase() === 'acpd' || parts[0]?.toLowerCase() === 'eeaa') ? 1 : 0;
      // Get the subcategory (content, background, border, display, heading, etc.)
      const subCategory = parts[startIdx + 1] || 'other';

      if (!groupMap.has(subCategory)) {
        groupMap.set(subCategory, []);
      }
      groupMap.get(subCategory)!.push(token);
    }

    // Sort groups and return
    return Array.from(groupMap.entries())
      .map(([name, tokens]) => ({ name, tokens }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tokens, activeTab]);

  const resolvedLight = tokensData?.resolvedLight || {};
  const resolvedDark = tokensData?.resolvedDark || {};

  if (tokens.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No tokens found in this category
      </div>
    );
  }

  // Calculate column count for colSpan
  const colCount = 2 + (viewMode === 'both' ? 2 : 1);

  return (
    <div className="p-6">
      {/* Category Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold capitalize">
          {selectedCategory?.split('/').pop() || 'Tokens'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {tokens.length} tokens{activeTab === 'brand' && tokenGroups.length > 1 && ` in ${tokenGroups.length} groups`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              {(viewMode === 'light' || viewMode === 'both') && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Light
                </th>
              )}
              {(viewMode === 'dark' || viewMode === 'both') && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dark
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preview
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tokenGroups.map((group) => (
              <Fragment key={group.name || 'default'}>
                {/* Group header for Brand tab with multiple groups - matches main heading style but smaller */}
                {group.name && tokenGroups.length > 1 && (
                  <tr className="bg-muted/30">
                    <td colSpan={colCount} className="px-4 py-3">
                      <span className="text-lg font-bold capitalize text-foreground">
                        {group.name}
                      </span>
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {group.tokens.length}
                      </span>
                    </td>
                  </tr>
                )}
                {group.tokens.map((token) => (
                  <TokenRow
                    key={token.path}
                    token={token}
                    viewMode={viewMode}
                    resolvedLight={resolvedLight}
                    resolvedDark={resolvedDark}
                    onSelect={setSelectedToken}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TokenRowProps {
  token: ResolvedToken;
  viewMode: 'light' | 'dark' | 'both';
  resolvedLight: Record<string, string | number | null>;
  resolvedDark: Record<string, string | number | null>;
  onSelect: (token: ResolvedToken) => void;
}

function TokenRow({ token, viewMode, resolvedLight, resolvedDark, onSelect }: TokenRowProps) {
  const lightValue = resolvedLight[token.path];
  const darkValue = resolvedDark[token.path];

  return (
    <tr
      onClick={() => onSelect(token)}
      className="cursor-pointer transition-colors hover:bg-accent"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-sm">{token.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{token.path}</div>
      </td>
      {(viewMode === 'light' || viewMode === 'both') && (
        <td className="px-4 py-3">
          <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
            {formatValue(lightValue)}
          </code>
        </td>
      )}
      {(viewMode === 'dark' || viewMode === 'both') && (
        <td className="px-4 py-3">
          <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
            {formatValue(darkValue)}
          </code>
        </td>
      )}
      <td className="px-4 py-3">
        <ValuePreview token={token} value={viewMode === 'dark' ? darkValue : lightValue} />
      </td>
    </tr>
  );
}

function ValuePreview({ token, value }: { token: ResolvedToken; value: string | number | null | undefined }) {
  if (token.type === 'FLOAT' && typeof value === 'number') {
    // Show a bar preview for spacing/sizing values
    const maxWidth = 100;
    const width = Math.min(value, maxWidth);
    
    return (
      <div className="flex items-center gap-2">
        <div
          className="h-3 bg-primary rounded"
          style={{ width: `${width}px` }}
        />
        <span className="text-xs text-muted-foreground">{value}px</span>
      </div>
    );
  }

  if (token.type === 'STRING' && typeof value === 'string') {
    // Show font family or easing preview
    if (value.includes('cubic-bezier') || value === 'linear' || value === 'ease') {
      return (
        <span className="text-xs font-mono text-muted-foreground">
          {value.slice(0, 30)}...
        </span>
      );
    }
    
    // Font family
    return (
      <span className="text-sm" style={{ fontFamily: value }}>
        Aa
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return String(value);
  return value;
}
