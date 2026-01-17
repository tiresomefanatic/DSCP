import type { ComponentTokens, InteractionState } from '../ui/types';

export interface HeadlessCardProps {
  tokens: ComponentTokens;
  state?: InteractionState;
  label?: string;
}

/**
 * Headless Card for token viewer previews
 *
 * A minimal preview component showing how card tokens apply.
 * Used in the Core layer matrix view.
 *
 * Size: 120x80px (as per spec)
 */
export function HeadlessCard({ tokens, state = 'default', label = 'Card' }: HeadlessCardProps) {
  return (
    <div
      data-state={state}
      style={{
        width: 120,
        height: 80,
        backgroundColor: tokens.bg ?? 'transparent',
        borderColor: tokens.border ?? 'transparent',
        color: tokens.text ?? 'inherit',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 8,
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: state === 'disabled' ? 0.5 : 1,
      }}
    >
      {label}
    </div>
  );
}
