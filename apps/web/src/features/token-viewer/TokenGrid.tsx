import { useMemo } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';

interface ColorPalette {
  name: string;
  tokens: ResolvedToken[];
}

export function TokenGrid() {
  const { data: tokensData } = useTokens();
  const { selectedCategory, viewMode, setSelectedToken } = useAppStore();

  // Get tokens for selected category
  const tokens = useMemo(() => {
    if (!tokensData?.tokens || !selectedCategory) return [];
    
    return tokensData.tokens.filter(token => {
      const tokenPath = `${token.collection}/${token.path}`;
      return tokenPath.startsWith(selectedCategory) || 
             `Global/${token.path}`.startsWith(selectedCategory);
    });
  }, [tokensData?.tokens, selectedCategory]);

  // Group tokens by color palette (e.g., blue, gray, red)
  const colorPalettes = useMemo(() => {
    const paletteMap = new Map<string, ResolvedToken[]>();
    
    for (const token of tokens) {
      const parts = token.path.split('/');
      // For colors: color/blue/500 -> palette is "blue"
      // For non-colors or simple tokens: just group by first part
      const paletteName = parts.length >= 2 ? parts[1] : parts[0];
      
      if (!paletteMap.has(paletteName)) {
        paletteMap.set(paletteName, []);
      }
      paletteMap.get(paletteName)!.push(token);
    }

    // Sort palettes and tokens within
    return Array.from(paletteMap.entries())
      .map(([name, tokens]) => ({
        name,
        tokens: tokens.sort((a, b) => {
          // Sort by numeric suffix if present (50, 100, 200...)
          const aNum = parseInt(a.name) || 0;
          const bNum = parseInt(b.name) || 0;
          return aNum - bNum;
        }),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tokens]);

  const resolvedLight = tokensData?.resolvedLight || {};
  const resolvedDark = tokensData?.resolvedDark || {};

  if (tokens.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No tokens found in this category
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Category Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold capitalize">
          {selectedCategory?.split('/').pop() || 'Colors'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {tokens.length} tokens in {colorPalettes.length} palettes
        </p>
      </div>

      {/* Grouped Color Palettes */}
      {viewMode === 'both' ? (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Light Mode
            </h3>
            <PaletteGroups palettes={colorPalettes} resolvedMap={resolvedLight} onSelect={setSelectedToken} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Dark Mode
            </h3>
            <PaletteGroups palettes={colorPalettes} resolvedMap={resolvedDark} onSelect={setSelectedToken} isDark />
          </div>
        </div>
      ) : (
        <PaletteGroups
          palettes={colorPalettes}
          resolvedMap={viewMode === 'dark' ? resolvedDark : resolvedLight}
          onSelect={setSelectedToken}
          isDark={viewMode === 'dark'}
        />
      )}
    </div>
  );
}

interface PaletteGroupsProps {
  palettes: ColorPalette[];
  resolvedMap: Record<string, string | number | null>;
  onSelect: (token: ResolvedToken) => void;
  isDark?: boolean;
}

function PaletteGroups({ palettes, resolvedMap, onSelect, isDark = false }: PaletteGroupsProps) {
  return (
    <div className={`space-y-8 ${isDark ? 'p-4 rounded-lg bg-gray-900' : ''}`}>
      {palettes.map((palette) => (
        <div key={palette.name}>
          {/* Palette Name Header */}
          <h4 className={`text-sm font-semibold mb-4 capitalize ${
            isDark ? 'text-gray-300' : 'text-foreground'
          }`}>
            {palette.name}
            <span className={`ml-2 text-xs font-normal ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`}>
              {palette.tokens.length}
            </span>
          </h4>
          {/* Color Swatches */}
          <div className="flex flex-wrap gap-3">
            {palette.tokens.map((token) => {
              const resolvedValue = resolvedMap[token.path];
              const colorValue = typeof resolvedValue === 'string' ? resolvedValue : '#ccc';
              const isValidColor = colorValue.startsWith('#') || colorValue.startsWith('rgb');

              return (
                <button
                  key={token.path}
                  onClick={() => onSelect(token)}
                  className="group flex flex-col items-center gap-2 p-2 rounded-lg transition-all hover:bg-accent"
                  title={`${token.name}: ${colorValue}`}
                >
                  {/* Color Swatch - larger size */}
                  <div
                    className={`h-16 w-16 rounded-lg shadow-md ring-1 ring-inset transition-transform group-hover:scale-105 ${
                      isDark ? 'ring-white/10' : 'ring-black/5'
                    }`}
                    style={{ 
                      backgroundColor: isValidColor ? colorValue : '#ccc',
                    }}
                  />
                  {/* Token Name (shade number) */}
                  <span className={`text-xs font-medium ${
                    isDark ? 'text-gray-400' : 'text-muted-foreground'
                  }`}>
                    {token.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
