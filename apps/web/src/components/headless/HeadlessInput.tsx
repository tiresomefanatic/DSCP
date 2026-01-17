import type { ComponentTokens, InteractionState } from '../ui/types';

export interface HeadlessInputProps {
  tokens: ComponentTokens;
  state?: InteractionState;
  placeholder?: string;
}

/**
 * Headless Input for token viewer previews
 *
 * A minimal preview component showing how input tokens apply.
 * Used in the Core layer matrix view.
 *
 * Size: 120x32px
 */
export function HeadlessInput({
  tokens,
  state = 'default',
  placeholder = 'Input',
}: HeadlessInputProps) {
  return (
    <input
      type="text"
      data-state={state}
      placeholder={placeholder}
      readOnly
      style={{
        width: 120,
        height: 32,
        backgroundColor: tokens.bg ?? 'transparent',
        color: tokens.text ?? 'inherit',
        borderColor: tokens.border ?? 'transparent',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 6,
        fontSize: 13,
        padding: '0 10px',
        opacity: state === 'disabled' ? 0.5 : 1,
        cursor: state === 'disabled' ? 'not-allowed' : 'text',
        outline: state === 'focused' ? '2px solid' : 'none',
        outlineColor: tokens.border ?? 'transparent',
        outlineOffset: 1,
      }}
      disabled={state === 'disabled'}
    />
  );
}
