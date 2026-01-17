/**
 * Component Token Types
 * Maps to the Core layer path schema:
 * core.{concept}.{component}.{property}.{prominence}.{meaning}.{state}
 */

export type Concept = 'action' | 'surface' | 'input' | 'feedback';
export type Prominence = 'dark' | 'light' | 'stroke';
export type Meaning = 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';
export type InteractionState = 'default' | 'hover' | 'pressed' | 'focused' | 'disabled';

/**
 * Resolved token values for styling components
 */
export interface ComponentTokens {
  bg?: string;
  text?: string;
  border?: string;
  placeholder?: string;
  icon?: string;
}

/**
 * Props for token-aware components
 */
export interface TokenableProps {
  /** Token prominence (fill style) */
  prominence?: Prominence;
  /** Token meaning (semantic variant) */
  meaning?: Meaning;
  /** Override tokens directly */
  tokens?: Partial<ComponentTokens>;
}

/**
 * Component state for token resolution
 */
export interface ComponentState {
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isDisabled: boolean;
}

/**
 * Headless component definition for the token viewer
 */
export interface HeadlessComponentDef {
  concept: Concept;
  component: string;
  tokenProperties: (keyof ComponentTokens)[];
  previewSize: { width: number; height: number };
}
