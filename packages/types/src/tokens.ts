/**
 * Internal Token Representation
 * Normalized format used throughout the application
 */

export type TokenTier = 'global' | 'brand' | 'component';
export type TokenType = 'COLOR' | 'FLOAT' | 'STRING';
export type TokenMode = 'light' | 'dark';
export type TokenBrand = 'acpd' | 'eeaa';

export interface ResolvedToken {
  /** Unique identifier from Figma */
  id: string;
  /** Full path using slash notation (e.g., "acpd/color/content/primary") */
  path: string;
  /** Human-readable name extracted from path */
  name: string;
  /** Token tier in the hierarchy */
  tier: TokenTier;
  /** Token data type */
  type: TokenType;
  /** Brand this token belongs to (null for global) */
  brand: TokenBrand | null;
  /** Category extracted from path (e.g., "color", "spacing") */
  category: string;
  /**
   * Value for global tokens (single mode)
   * Either a direct value or an alias reference starting with @
   */
  value?: string | number;
  /**
   * Values for brand tokens (per theme mode: light/dark)
   * Values can be direct or alias references
   */
  values?: {
    light?: string | number;
    dark?: string | number;
  };
  /**
   * Values for Core/component tokens (per brand: acpd/eeaa)
   * These reference Brand tokens which then have light/dark values
   * Following Token Transformation Theory: Core → Brand → Global
   */
  brandValues?: {
    acpd?: string | number;
    eeaa?: string | number;
  };
  /** Collection this token belongs to */
  collection: string;
}

/**
 * Tree structure for UI navigation
 */
export interface TokenTreeNode {
  /** Node name (segment of path) */
  name: string;
  /** Full path to this node */
  path: string;
  /** Child nodes */
  children: TokenTreeNode[];
  /** Token at this node (if leaf) */
  token?: ResolvedToken;
  /** Whether this is a leaf node with a token */
  isLeaf: boolean;
}

/**
 * Token change representation for diffs
 */
export interface TokenChange {
  path: string;
  type: TokenType;
  mode?: TokenMode;
  oldValue: string | number | null;
  newValue: string | number;
  /** Resolved display values for visual diff */
  oldResolved?: string | number | null;
  newResolved?: string | number;
}

/**
 * Validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  errors: TokenValidationError[];
}

export interface TokenValidationError {
  path: string;
  message: string;
  type: 'circular_reference' | 'missing_reference' | 'type_mismatch' | 'invalid_value';
}

/**
 * Token update request
 */
export interface TokenUpdateRequest {
  tokenPath: string;
  mode?: TokenMode;
  value: string | number;
  /** If true, value is an alias reference (without @) */
  isAlias?: boolean;
}
