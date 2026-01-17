import * as React from 'react';
import { clsx } from 'clsx';
import type { ComponentTokens, Prominence, Meaning } from './types';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Token prominence */
  prominence?: Prominence;
  /** Token meaning */
  meaning?: Meaning;
  /** Direct token overrides */
  tokens?: Partial<ComponentTokens>;
}

/**
 * Input component with token support
 *
 * Data attributes for token targeting:
 * - data-prominence: dark | light | stroke
 * - data-meaning: primary | secondary | destructive | etc.
 * - data-state: default | focused | disabled | error
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', prominence = 'light', meaning, tokens, disabled, style, ...props }, ref) => {
    const tokenStyles: React.CSSProperties = tokens
      ? {
          backgroundColor: tokens.bg,
          color: tokens.text,
          borderColor: tokens.border,
          ...style,
        }
      : { ...style };

    return (
      <input
        type={type}
        ref={ref}
        className={clsx(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        data-prominence={prominence}
        data-meaning={meaning}
        data-state={disabled ? 'disabled' : undefined}
        disabled={disabled}
        style={tokenStyles}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
