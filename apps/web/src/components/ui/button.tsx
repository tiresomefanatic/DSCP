import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';
import type { ComponentTokens, Prominence, Meaning } from './types';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as child element (composition pattern) */
  asChild?: boolean;
  /** Token prominence - controls fill style */
  prominence?: Prominence;
  /** Token meaning - semantic variant */
  meaning?: Meaning;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Direct token overrides */
  tokens?: Partial<ComponentTokens>;
}

/**
 * Button component with token support
 *
 * Uses data attributes for styling that can be targeted by tokens:
 * - data-prominence: dark | light | stroke
 * - data-meaning: primary | secondary | destructive | success | warning
 * - data-state: default | hover | pressed | disabled
 *
 * @example
 * // With tokens via CSS variables
 * <Button prominence="dark" meaning="primary">Click me</Button>
 *
 * // With direct token values
 * <Button tokens={{ bg: '#2563eb', text: '#ffffff' }}>Click me</Button>
 *
 * // As child (composition)
 * <Button asChild><a href="/link">Link Button</a></Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      asChild = false,
      prominence = 'dark',
      meaning = 'primary',
      size = 'md',
      tokens,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Build token-based styles
    const tokenStyles: React.CSSProperties = tokens
      ? {
          backgroundColor: tokens.bg,
          color: tokens.text,
          borderColor: tokens.border,
          ...style,
        }
      : { ...style };

    return (
      <Comp
        ref={ref}
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Size variants
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          // Default styling when no tokens provided (can be overridden)
          !tokens && 'border',
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

Button.displayName = 'Button';

export { Button };
