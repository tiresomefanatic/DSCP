import type { ComponentTokens, InteractionState } from '../ui/types';

export interface HeadlessButtonProps {
  tokens: ComponentTokens;
  state?: InteractionState;
  label?: string;
}

/**
 * Headless Button for token viewer previews
 *
 * A minimal, pure preview component that renders a button
 * with the exact tokens provided. Used in the Core layer
 * matrix view to show how tokens apply to buttons.
 *
 * Size: 80x32px (as per spec)
 */
export function HeadlessButton({ tokens, state = 'default', label = 'Button' }: HeadlessButtonProps) {
  return (
    <button
      type="button"
      data-state={state}
      style={{
        width: 80,
        height: 32,
        backgroundColor: tokens.bg ?? 'transparent',
        color: tokens.text ?? 'inherit',
        borderColor: tokens.border ?? 'transparent',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
        opacity: state === 'disabled' ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'none', // No transitions in preview
      }}
      disabled={state === 'disabled'}
    >
      {label}
    </button>
  );
}
