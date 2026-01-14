import type {
  ResolvedToken,
  TokenMode,
  TokenBrand,
  TokenValidationResult,
  TokenValidationError,
} from '@dscp/types';
import { isAlias, parseAlias } from '@dscp/types';

/**
 * TokenResolver handles alias resolution and validation
 */
export class TokenResolver {
  private tokens: Map<string, ResolvedToken>;
  private tokensByCollection: Map<string, Map<string, ResolvedToken>>;

  constructor(tokens: ResolvedToken[]) {
    this.tokens = new Map(tokens.map((t) => [t.path, t]));
    this.tokensByCollection = new Map();

    // Index tokens by collection for alias resolution
    for (const token of tokens) {
      if (!this.tokensByCollection.has(token.collection)) {
        this.tokensByCollection.set(token.collection, new Map());
      }
      this.tokensByCollection.get(token.collection)!.set(token.path, token);
    }
  }

  /**
   * Get a token by path
   */
  get(path: string): ResolvedToken | undefined {
    return this.tokens.get(path);
  }

  /**
   * Get all tokens
   */
  getAll(): ResolvedToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Resolve a token value, following alias references
   * Alias format: "CollectionName:path/to/token"
   */
  resolve(path: string, mode: TokenMode = 'light'): string | number | null {
    const token = this.tokens.get(path);
    if (!token) return null;

    let value: string | number | undefined;

    if (token.tier === 'global') {
      value = token.value;
    } else {
      value = token.values?.[mode];
    }

    if (value === undefined) return null;

    // Resolve alias reference (format: "Collection:path")
    if (isAlias(value)) {
      const parsed = parseAlias(value);
      if (!parsed) return null;

      // Find the referenced token
      const collectionTokens = this.tokensByCollection.get(parsed.collection);
      if (!collectionTokens) return null;

      const referencedToken = collectionTokens.get(parsed.path);
      if (!referencedToken) return null;

      // Recursively resolve
      return this.resolveToken(referencedToken, mode);
    }

    return value;
  }

  /**
   * Resolve a token's value
   */
  private resolveToken(
    token: ResolvedToken,
    mode: TokenMode,
    visited: Set<string> = new Set()
  ): string | number | null {
    // Prevent infinite loops
    if (visited.has(token.id)) return null;
    visited.add(token.id);

    let value: string | number | undefined;

    if (token.tier === 'global') {
      value = token.value;
    } else {
      value = token.values?.[mode];
    }

    if (value === undefined) return null;

    // Resolve alias reference
    if (isAlias(value)) {
      const parsed = parseAlias(value);
      if (!parsed) return null;

      const collectionTokens = this.tokensByCollection.get(parsed.collection);
      if (!collectionTokens) return null;

      const referencedToken = collectionTokens.get(parsed.path);
      if (!referencedToken) return null;

      return this.resolveToken(referencedToken, mode, visited);
    }

    return value;
  }

  /**
   * Resolve all tokens for a brand and mode
   */
  resolveAll(
    brand: TokenBrand,
    mode: TokenMode = 'light'
  ): Map<string, string | number | null> {
    const result = new Map<string, string | number | null>();

    for (const token of this.tokens.values()) {
      // Include global tokens and tokens matching the brand
      if (token.tier === 'global' || token.brand === brand) {
        result.set(token.path, this.resolve(token.path, mode));
      }
    }

    return result;
  }

  /**
   * Validate all tokens for errors
   */
  validate(): TokenValidationResult {
    const errors: TokenValidationError[] = [];

    for (const token of this.tokens.values()) {
      // Check for circular references
      const circularErrors = this.checkCircularReferences(token);
      errors.push(...circularErrors);

      // Check for missing references
      const missingErrors = this.checkMissingReferences(token);
      errors.push(...missingErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for circular references starting from a token
   */
  private checkCircularReferences(token: ResolvedToken): TokenValidationError[] {
    const errors: TokenValidationError[] = [];
    const modes: TokenMode[] = token.tier === 'global' ? ['light'] : ['light', 'dark'];

    for (const mode of modes) {
      const visited = new Set<string>();
      if (this.hasCircularRef(token, mode, visited)) {
        errors.push({
          path: token.path,
          message: `Circular reference detected in ${mode} mode`,
          type: 'circular_reference',
        });
      }
    }

    return errors;
  }

  /**
   * Recursively check for circular references
   */
  private hasCircularRef(
    token: ResolvedToken,
    mode: TokenMode,
    visited: Set<string>
  ): boolean {
    if (visited.has(token.id)) return true;

    let value: string | number | undefined;
    if (token.tier === 'global') {
      value = token.value;
    } else {
      value = token.values?.[mode];
    }

    if (value && isAlias(value)) {
      visited.add(token.id);
      const parsed = parseAlias(value);
      if (!parsed) return false;

      const collectionTokens = this.tokensByCollection.get(parsed.collection);
      if (!collectionTokens) return false;

      const referencedToken = collectionTokens.get(parsed.path);
      if (!referencedToken) return false;

      return this.hasCircularRef(referencedToken, mode, visited);
    }

    return false;
  }

  /**
   * Check for missing references in a token
   */
  private checkMissingReferences(token: ResolvedToken): TokenValidationError[] {
    const errors: TokenValidationError[] = [];

    const checkValue = (value: string | number | undefined, mode?: TokenMode) => {
      if (value && isAlias(value)) {
        const parsed = parseAlias(value);
        if (!parsed) {
          errors.push({
            path: token.path,
            message: `Invalid alias format: ${value}`,
            type: 'invalid_value',
          });
          return;
        }

        const collectionTokens = this.tokensByCollection.get(parsed.collection);
        if (!collectionTokens || !collectionTokens.has(parsed.path)) {
          errors.push({
            path: token.path,
            message: `Missing reference: ${value}${mode ? ` in ${mode} mode` : ''}`,
            type: 'missing_reference',
          });
        }
      }
    };

    if (token.tier === 'global') {
      checkValue(token.value);
    } else {
      checkValue(token.values?.light, 'light');
      checkValue(token.values?.dark, 'dark');
    }

    return errors;
  }

  /**
   * Update a token value (returns updated copy, doesn't mutate original)
   */
  update(
    path: string,
    value: string | number,
    mode?: TokenMode
  ): ResolvedToken | null {
    const token = this.tokens.get(path);
    if (!token) return null;

    const updated = { ...token };

    if (token.tier === 'global') {
      updated.value = value;
    } else if (mode) {
      updated.values = {
        ...token.values,
        [mode]: value,
      };
    }

    this.tokens.set(path, updated);
    return updated;
  }

  /**
   * Get tokens filtered by category
   */
  getByCategory(category: string): ResolvedToken[] {
    return Array.from(this.tokens.values()).filter((t) => t.category === category);
  }

  /**
   * Get tokens filtered by tier
   */
  getByTier(tier: ResolvedToken['tier']): ResolvedToken[] {
    return Array.from(this.tokens.values()).filter((t) => t.tier === tier);
  }

  /**
   * Get tokens filtered by collection
   */
  getByCollection(collection: string): ResolvedToken[] {
    return Array.from(this.tokensByCollection.get(collection)?.values() || []);
  }

  /**
   * Search tokens by path or name
   */
  search(query: string): ResolvedToken[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tokens.values()).filter(
      (t) =>
        t.path.toLowerCase().includes(lowerQuery) ||
        t.name.toLowerCase().includes(lowerQuery)
    );
  }
}
