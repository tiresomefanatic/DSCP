import type {
  TokensFile,
  TokenCollection,
  NestedVariables,
  TokenVariable,
  ResolvedToken,
  TokenTier,
  TokenType,
  TokenBrand,
} from '@dscp/types';
import { isTokenVariable } from '@dscp/types';

/**
 * TokenParser transforms nested token structure into flat resolved tokens
 */
export class TokenParser {
  private collections: Map<string, TokenCollection>;

  constructor(tokensFile: TokensFile) {
    this.collections = new Map(tokensFile.collections.map((c) => [c.name, c]));
  }

  /**
   * Parse all tokens from all collections
   */
  parseAll(): ResolvedToken[] {
    const tokens: ResolvedToken[] = [];

    for (const collection of this.collections.values()) {
      const tier = this.getTier(collection.name);
      const collectionTokens = this.parseCollection(collection, tier);
      tokens.push(...collectionTokens);
    }

    return tokens;
  }

  /**
   * Parse tokens filtered by brand (includes global tokens)
   */
  parseByBrand(brand: TokenBrand): ResolvedToken[] {
    return this.parseAll().filter(
      (token) => token.brand === brand || token.tier === 'global' || !token.brand
    );
  }

  /**
   * Get collection names
   */
  getCollections(): string[] {
    return Array.from(this.collections.keys());
  }

  /**
   * Determine tier based on collection name
   */
  private getTier(collectionName: string): TokenTier {
    const name = collectionName.toLowerCase();
    if (name === 'global') return 'global';
    if (name === 'brand') return 'brand';
    return 'component';
  }

  /**
   * Parse all tokens from a collection
   */
  private parseCollection(collection: TokenCollection, tier: TokenTier): ResolvedToken[] {
    const tokens: ResolvedToken[] = [];
    const modes = collection.modes;

    this.walkVariables(
      collection.variables,
      [],
      (path, variable) => {
        const token = this.createToken(path, variable, collection.name, tier, modes);
        if (token) {
          tokens.push(token);
        }
      }
    );

    return tokens;
  }

  /**
   * Recursively walk the nested variable structure
   */
  private walkVariables(
    obj: NestedVariables,
    path: string[],
    callback: (path: string[], variable: TokenVariable) => void
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (isTokenVariable(value)) {
        callback(currentPath, value);
      } else if (typeof value === 'object' && value !== null) {
        this.walkVariables(value as NestedVariables, currentPath, callback);
      }
    }
  }

  /**
   * Create a resolved token from a variable
   */
  private createToken(
    pathParts: string[],
    variable: TokenVariable,
    collectionName: string,
    tier: TokenTier,
    modes: string[]
  ): ResolvedToken | null {
    const path = pathParts.join('/');
    const name = pathParts[pathParts.length - 1] || path;

    // Extract brand from path for brand/component tokens
    let brand: TokenBrand | null = null;
    let category = pathParts[0] || 'other';

    if (tier !== 'global' && pathParts.length > 0) {
      const first = pathParts[0]?.toLowerCase();
      if (first === 'acpd' || first === 'eeaa') {
        brand = first as TokenBrand;
        category = pathParts[1] || 'other';
      }
    }

    // Map variable type to token type
    const type = this.mapType(variable.type);

    const token: ResolvedToken = {
      id: `${collectionName}:${path}`,
      path,
      name,
      tier,
      type,
      brand,
      category,
      collection: collectionName,
    };

    // Handle values based on modes
    if (modes.length === 1 && modes[0] === 'Default') {
      // Global tokens - single value
      token.value = variable.values['Default'];
    } else {
      // Brand/component tokens - light/dark values
      token.values = {
        light: variable.values['Light'],
        dark: variable.values['Dark'],
      };
    }

    return token;
  }

  /**
   * Map variable type to our token type
   */
  private mapType(type: string): TokenType {
    switch (type.toLowerCase()) {
      case 'color':
        return 'COLOR';
      case 'number':
      case 'float':
        return 'FLOAT';
      default:
        return 'STRING';
    }
  }
}
