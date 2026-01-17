import * as React from 'react';
import { clsx } from 'clsx';
import type { ComponentTokens, Prominence, Meaning } from './types';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Token prominence */
  prominence?: Prominence;
  /** Token meaning */
  meaning?: Meaning;
  /** Direct token overrides */
  tokens?: Partial<ComponentTokens>;
}

/**
 * Card component with token support
 *
 * Data attributes for token targeting:
 * - data-prominence: dark | light | stroke
 * - data-meaning: primary | secondary | etc.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, prominence = 'light', meaning, tokens, style, ...props }, ref) => {
    const tokenStyles: React.CSSProperties = tokens
      ? {
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          color: tokens.text,
          ...style,
        }
      : { ...style };

    return (
      <div
        ref={ref}
        className={clsx('rounded-lg border', className)}
        data-prominence={prominence}
        data-meaning={meaning}
        style={tokenStyles}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={clsx('font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={clsx('text-sm opacity-70', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
