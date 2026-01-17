import { useMemo, useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';
import { HeadlessButton, HeadlessCard, HeadlessInput } from '@/components/headless';
import type { ComponentTokens, InteractionState } from '@/components/ui/types';

/**
 * Core Token Structure (from Token Transformation Theory):
 * core.{concept}.{component}.{property}.{prominence}.{meaning}-{state}
 *
 * Example: action/button/bg/dark/primary-default
 * - concept: action
 * - component: button
 * - property: bg
 * - prominence: dark
 * - meaning: primary
 * - state: default
 */

interface ParsedCoreToken {
  token: ResolvedToken;
  concept: string;
  component: string;
  property: string;
  prominence: string;
  meaning: string;
  state: string;
}

// Parse a Core token path into its constituent parts
function parseCoreToken(token: ResolvedToken): ParsedCoreToken | null {
  const parts = token.path.split('/');
  if (parts.length < 5) return null;

  const [concept, component, property, prominence, meaningState] = parts;

  // meaning-state is combined: "primary-default", "secondary-hover", etc.
  const lastDash = meaningState?.lastIndexOf('-') ?? -1;
  if (lastDash === -1) return null;

  const meaning = meaningState.slice(0, lastDash);
  const state = meaningState.slice(lastDash + 1);

  return {
    token,
    concept,
    component,
    property,
    prominence,
    meaning,
    state,
  };
}

// Group tokens by property, then prominence, then meaning
interface TokenGroup {
  property: string;
  prominences: {
    prominence: string;
    meanings: {
      meaning: string;
      states: Map<string, ParsedCoreToken>; // state -> token
    }[];
  }[];
}

type DisplayMode = 'swatch' | 'preview';

// Map state names to InteractionState type
function toInteractionState(state: string): InteractionState {
  const stateMap: Record<string, InteractionState> = {
    default: 'default',
    hover: 'hover',
    pressed: 'pressed',
    focused: 'focused',
    disabled: 'disabled',
  };
  return stateMap[state] || 'default';
}

// Get the appropriate headless component for a given component name
function getHeadlessRenderer(componentName: string) {
  switch (componentName) {
    case 'button':
      return HeadlessButton;
    case 'card':
      return HeadlessCard;
    case 'input':
    case 'textfield':
      return HeadlessInput;
    default:
      return HeadlessButton; // Fallback
  }
}

export function CoreTokenView() {
  const { data: tokensData } = useTokens();
  const { selectedCategory, viewMode, setSelectedToken, selectedBrand } = useAppStore();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('preview');

  // Parse and filter tokens for the selected component
  const { parsedTokens, componentName } = useMemo(() => {
    if (!tokensData?.tokens || !selectedCategory) {
      return { parsedTokens: [], componentName: '' };
    }

    // selectedCategory format: "Core/action/button" or "Core/action"
    const categoryParts = selectedCategory.split('/');
    const concept = categoryParts[1] || '';
    const component = categoryParts[2] || '';

    const filtered = tokensData.tokens
      .filter(t => t.collection === 'Core')
      .filter(t => {
        const parts = t.path.split('/');
        if (component) {
          return parts[0] === concept && parts[1] === component;
        }
        return parts[0] === concept;
      })
      .map(parseCoreToken)
      .filter((p): p is ParsedCoreToken => p !== null);

    return {
      parsedTokens: filtered,
      componentName: component || concept,
    };
  }, [tokensData?.tokens, selectedCategory]);

  // Group tokens hierarchically
  const tokenGroups = useMemo((): TokenGroup[] => {
    const propertyMap = new Map<string, Map<string, Map<string, Map<string, ParsedCoreToken>>>>();

    for (const pt of parsedTokens) {
      if (!propertyMap.has(pt.property)) {
        propertyMap.set(pt.property, new Map());
      }
      const prominenceMap = propertyMap.get(pt.property)!;

      if (!prominenceMap.has(pt.prominence)) {
        prominenceMap.set(pt.prominence, new Map());
      }
      const meaningMap = prominenceMap.get(pt.prominence)!;

      if (!meaningMap.has(pt.meaning)) {
        meaningMap.set(pt.meaning, new Map());
      }
      meaningMap.get(pt.meaning)!.set(pt.state, pt);
    }

    // Convert to array structure
    const groups: TokenGroup[] = [];
    const propertyOrder = ['bg', 'text', 'border', 'icon'];
    const prominenceOrder = ['dark', 'light', 'stroke'];
    const meaningOrder = ['primary', 'secondary', 'destructive'];

    const sortByOrder = (arr: string[], order: string[]) =>
      arr.sort((a, b) => {
        const aIdx = order.indexOf(a);
        const bIdx = order.indexOf(b);
        if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });

    for (const property of sortByOrder(Array.from(propertyMap.keys()), propertyOrder)) {
      const prominenceMap = propertyMap.get(property)!;
      const prominences: TokenGroup['prominences'] = [];

      for (const prominence of sortByOrder(Array.from(prominenceMap.keys()), prominenceOrder)) {
        const meaningMap = prominenceMap.get(prominence)!;
        const meanings: TokenGroup['prominences'][0]['meanings'] = [];

        for (const meaning of sortByOrder(Array.from(meaningMap.keys()), meaningOrder)) {
          meanings.push({
            meaning,
            states: meaningMap.get(meaning)!,
          });
        }

        prominences.push({ prominence, meanings });
      }

      groups.push({ property, prominences });
    }

    return groups;
  }, [parsedTokens]);

  // Get all unique states for column headers
  const allStates = useMemo(() => {
    const states = new Set<string>();
    for (const pt of parsedTokens) {
      states.add(pt.state);
    }
    const stateOrder = ['default', 'hover', 'pressed', 'disabled'];
    return Array.from(states).sort((a, b) => {
      const aIdx = stateOrder.indexOf(a);
      const bIdx = stateOrder.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }, [parsedTokens]);

  const resolvedLight = tokensData?.resolvedLight || {};
  const resolvedDark = tokensData?.resolvedDark || {};

  // Group tokens for preview mode: prominence.meaning -> { state -> { property -> token } }
  const previewGroups = useMemo(() => {
    const groups = new Map<string, Map<string, Map<string, ParsedCoreToken>>>();

    for (const pt of parsedTokens) {
      const key = `${pt.prominence}.${pt.meaning}`;
      if (!groups.has(key)) {
        groups.set(key, new Map());
      }
      const stateMap = groups.get(key)!;
      if (!stateMap.has(pt.state)) {
        stateMap.set(pt.state, new Map());
      }
      stateMap.get(pt.state)!.set(pt.property, pt);
    }

    // Convert to sorted array
    const prominenceOrder = ['dark', 'light', 'stroke'];
    const meaningOrder = ['primary', 'secondary', 'destructive'];

    return Array.from(groups.entries())
      .map(([key, stateMap]) => {
        const [prominence, meaning] = key.split('.');
        return { key, prominence, meaning, stateMap };
      })
      .sort((a, b) => {
        const aPromIdx = prominenceOrder.indexOf(a.prominence);
        const bPromIdx = prominenceOrder.indexOf(b.prominence);
        if (aPromIdx !== bPromIdx) {
          return (aPromIdx === -1 ? 999 : aPromIdx) - (bPromIdx === -1 ? 999 : bPromIdx);
        }
        const aMeanIdx = meaningOrder.indexOf(a.meaning);
        const bMeanIdx = meaningOrder.indexOf(b.meaning);
        return (aMeanIdx === -1 ? 999 : aMeanIdx) - (bMeanIdx === -1 ? 999 : bMeanIdx);
      });
  }, [parsedTokens]);

  if (parsedTokens.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a component to view its token matrix
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold capitalize">{componentName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {parsedTokens.length} tokens across {tokenGroups.length} properties
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Brand: <span className="font-medium uppercase">{selectedBrand}</span>
          </p>
        </div>

        {/* Display Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/30">
          <button
            onClick={() => setDisplayMode('preview')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              displayMode === 'preview'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setDisplayMode('swatch')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              displayMode === 'swatch'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Swatches
          </button>
        </div>
      </div>

      {/* Preview Mode - Component Previews */}
      {displayMode === 'preview' && (
        <div className="mb-8">
          {viewMode === 'both' ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Light Mode
                </h4>
                <PreviewMatrix
                  previewGroups={previewGroups}
                  states={allStates}
                  resolvedMap={resolvedLight}
                  componentName={componentName}
                  onSelect={setSelectedToken}
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Dark Mode
                </h4>
                <PreviewMatrix
                  previewGroups={previewGroups}
                  states={allStates}
                  resolvedMap={resolvedDark}
                  componentName={componentName}
                  onSelect={setSelectedToken}
                  isDark
                />
              </div>
            </div>
          ) : (
            <PreviewMatrix
              previewGroups={previewGroups}
              states={allStates}
              resolvedMap={viewMode === 'dark' ? resolvedDark : resolvedLight}
              componentName={componentName}
              onSelect={setSelectedToken}
              isDark={viewMode === 'dark'}
            />
          )}
        </div>
      )}

      {/* Swatch Mode - Token Matrix by Property */}
      {displayMode === 'swatch' && tokenGroups.map((group) => (
        <div key={group.property} className="mb-8">
          <h3 className="text-lg font-bold capitalize mb-4">{group.property}</h3>

          {viewMode === 'both' ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Light Mode
                </h4>
                <PropertyMatrix
                  group={group}
                  states={allStates}
                  resolvedMap={resolvedLight}
                  onSelect={setSelectedToken}
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Dark Mode
                </h4>
                <PropertyMatrix
                  group={group}
                  states={allStates}
                  resolvedMap={resolvedDark}
                  onSelect={setSelectedToken}
                  isDark
                />
              </div>
            </div>
          ) : (
            <PropertyMatrix
              group={group}
              states={allStates}
              resolvedMap={viewMode === 'dark' ? resolvedDark : resolvedLight}
              onSelect={setSelectedToken}
              isDark={viewMode === 'dark'}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface PropertyMatrixProps {
  group: TokenGroup;
  states: string[];
  resolvedMap: Record<string, string | number | null>;
  onSelect: (token: ResolvedToken) => void;
  isDark?: boolean;
}

function PropertyMatrix({ group, states, resolvedMap, onSelect, isDark = false }: PropertyMatrixProps) {
  return (
    <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-900' : ''}`}>
      <table className="w-full">
        <thead className={isDark ? 'bg-gray-800' : 'bg-muted/50'}>
          <tr>
            <th className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-400' : 'text-muted-foreground'
            }`}>
              Prominence / Meaning
            </th>
            {states.map((state) => (
              <th key={state} className={`px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-400' : 'text-muted-foreground'
              }`}>
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y'}>
          {group.prominences.map((prom) => (
            prom.meanings.map((meaning, idx) => (
              <tr key={`${prom.prominence}-${meaning.meaning}`} className={isDark ? 'hover:bg-gray-800' : 'hover:bg-accent'}>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : ''}`}>
                  {idx === 0 && (
                    <span className="font-semibold capitalize">{prom.prominence}</span>
                  )}
                  {idx === 0 ? ' / ' : <span className="ml-16" />}
                  <span className="capitalize">{meaning.meaning}</span>
                </td>
                {states.map((state) => {
                  const pt = meaning.states.get(state);
                  if (!pt) {
                    return (
                      <td key={state} className="px-4 py-3 text-center">
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-muted-foreground'}`}>—</span>
                      </td>
                    );
                  }

                  const resolvedValue = resolvedMap[pt.token.path];
                  const colorValue = typeof resolvedValue === 'string' ? resolvedValue : '#ccc';
                  const isValidColor = colorValue.startsWith('#') || colorValue.startsWith('rgb');

                  return (
                    <td key={state} className="px-4 py-3">
                      <button
                        onClick={() => onSelect(pt.token)}
                        className="group flex flex-col items-center gap-1 w-full"
                        title={`${pt.token.path}: ${colorValue}`}
                      >
                        <div
                          className={`h-10 w-10 rounded-md shadow-sm ring-1 ring-inset transition-transform group-hover:scale-110 ${
                            isDark ? 'ring-white/10' : 'ring-black/5'
                          }`}
                          style={{
                            backgroundColor: isValidColor ? colorValue : '#ccc',
                          }}
                        />
                        <span className={`text-[10px] font-mono ${
                          isDark ? 'text-gray-500' : 'text-muted-foreground'
                        }`}>
                          {colorValue.slice(0, 9)}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Preview Matrix - renders headless components
interface PreviewMatrixProps {
  previewGroups: Array<{
    key: string;
    prominence: string;
    meaning: string;
    stateMap: Map<string, Map<string, ParsedCoreToken>>;
  }>;
  states: string[];
  resolvedMap: Record<string, string | number | null>;
  componentName: string;
  onSelect: (token: ResolvedToken) => void;
  isDark?: boolean;
}

function PreviewMatrix({
  previewGroups,
  states,
  resolvedMap,
  componentName,
  onSelect,
  isDark = false,
}: PreviewMatrixProps) {
  const HeadlessComponent = getHeadlessRenderer(componentName);

  // Collect tokens for a cell and resolve to ComponentTokens
  const getTokensForCell = (
    propertyMap: Map<string, ParsedCoreToken> | undefined
  ): ComponentTokens => {
    if (!propertyMap) return {};

    const tokens: ComponentTokens = {};
    for (const [property, pt] of propertyMap) {
      const resolved = resolvedMap[pt.token.path];
      if (typeof resolved === 'string') {
        if (property === 'bg') tokens.bg = resolved;
        if (property === 'text') tokens.text = resolved;
        if (property === 'border') tokens.border = resolved;
        if (property === 'placeholder') tokens.placeholder = resolved;
        if (property === 'icon') tokens.icon = resolved;
      }
    }
    return tokens;
  };

  // Get the first token in a cell for selection
  const getFirstToken = (
    propertyMap: Map<string, ParsedCoreToken> | undefined
  ): ResolvedToken | null => {
    if (!propertyMap || propertyMap.size === 0) return null;
    return propertyMap.values().next().value?.token || null;
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-900' : ''}`}>
      <table className="w-full">
        <thead className={isDark ? 'bg-gray-800' : 'bg-muted/50'}>
          <tr>
            <th
              className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-400' : 'text-muted-foreground'
              }`}
            >
              Prominence / Meaning
            </th>
            {states.map((state) => (
              <th
                key={state}
                className={`px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-muted-foreground'
                }`}
              >
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y'}>
          {previewGroups.map((group, idx) => {
            const prevGroup = previewGroups[idx - 1];
            const showProminence = !prevGroup || prevGroup.prominence !== group.prominence;

            return (
              <tr
                key={group.key}
                className={isDark ? 'hover:bg-gray-800' : 'hover:bg-accent'}
              >
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : ''}`}>
                  {showProminence && (
                    <span className="font-semibold capitalize">{group.prominence}</span>
                  )}
                  {showProminence ? ' / ' : <span className="ml-16" />}
                  <span className="capitalize">{group.meaning}</span>
                </td>
                {states.map((state) => {
                  const propertyMap = group.stateMap.get(state);
                  const tokens = getTokensForCell(propertyMap);
                  const firstToken = getFirstToken(propertyMap);
                  const hasTokens = Object.keys(tokens).length > 0;

                  if (!hasTokens) {
                    return (
                      <td key={state} className="px-4 py-3 text-center">
                        <span
                          className={`text-xs ${
                            isDark ? 'text-gray-600' : 'text-muted-foreground'
                          }`}
                        >
                          —
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={state} className="px-4 py-4">
                      <button
                        onClick={() => firstToken && onSelect(firstToken)}
                        className="group flex flex-col items-center gap-2 w-full"
                        title={`${group.prominence}.${group.meaning}.${state}`}
                      >
                        <div className="transition-transform group-hover:scale-105">
                          <HeadlessComponent
                            tokens={tokens}
                            state={toInteractionState(state)}
                          />
                        </div>
                        <div className="flex gap-1">
                          {tokens.bg && (
                            <div
                              className={`h-3 w-3 rounded-sm ring-1 ${
                                isDark ? 'ring-white/20' : 'ring-black/10'
                              }`}
                              style={{ backgroundColor: tokens.bg }}
                              title={`bg: ${tokens.bg}`}
                            />
                          )}
                          {tokens.text && (
                            <div
                              className={`h-3 w-3 rounded-sm ring-1 ${
                                isDark ? 'ring-white/20' : 'ring-black/10'
                              }`}
                              style={{ backgroundColor: tokens.text }}
                              title={`text: ${tokens.text}`}
                            />
                          )}
                          {tokens.border && (
                            <div
                              className={`h-3 w-3 rounded-sm ring-1 ${
                                isDark ? 'ring-white/20' : 'ring-black/10'
                              }`}
                              style={{ backgroundColor: tokens.border }}
                              title={`border: ${tokens.border}`}
                            />
                          )}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
