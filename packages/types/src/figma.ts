/**
 * Token File Format
 * Types representing the actual JSON structure from Figma export
 */

export interface TokensFile {
  collections: TokenCollection[];
}

export interface TokenCollection {
  name: string;
  modes: string[]; // e.g., ["Default"] or ["Light", "Dark"]
  variables: NestedVariables;
}

/**
 * Variables are nested objects where the path forms the token path
 * e.g., { color: { blue: { 500: { type: "color", values: {...} } } } }
 */
export type NestedVariables = {
  [key: string]: NestedVariables | TokenVariable;
};

export interface TokenVariable {
  type: TokenVariableType;
  values: Record<string, string | number>; // mode -> value or alias
}

export type TokenVariableType = 'color' | 'number' | 'string';

/**
 * Check if a nested object is a token variable (has type and values)
 */
export function isTokenVariable(obj: unknown): obj is TokenVariable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'values' in obj &&
    typeof (obj as TokenVariable).type === 'string' &&
    typeof (obj as TokenVariable).values === 'object'
  );
}

/**
 * Alias format: "CollectionName:path/to/token"
 * e.g., "Global:color/blue/500"
 */
export function isAlias(value: string | number): value is string {
  return typeof value === 'string' && value.includes(':');
}

export function parseAlias(alias: string): { collection: string; path: string } | null {
  if (!isAlias(alias)) return null;
  const [collection, path] = alias.split(':');
  return { collection, path };
}
