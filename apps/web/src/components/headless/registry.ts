import type { ReactNode } from 'react';
import type { ComponentTokens, InteractionState, Concept, HeadlessComponentDef } from '../ui/types';
import { HeadlessButton } from './HeadlessButton';
import { HeadlessCard } from './HeadlessCard';
import { HeadlessInput } from './HeadlessInput';

/**
 * Headless Component Registry
 *
 * Maps component identifiers to their headless preview implementations.
 * Used by the token viewer to render live previews in the Core layer matrix.
 */

export interface HeadlessRenderer {
  (tokens: ComponentTokens, state: InteractionState): ReactNode;
}

export interface HeadlessComponentEntry extends HeadlessComponentDef {
  render: HeadlessRenderer;
}

export const headlessRegistry: HeadlessComponentEntry[] = [
  {
    concept: 'action',
    component: 'button',
    tokenProperties: ['bg', 'text', 'border'],
    previewSize: { width: 80, height: 32 },
    render: (tokens, state) => HeadlessButton({ tokens, state }),
  },
  {
    concept: 'surface',
    component: 'card',
    tokenProperties: ['bg', 'border'],
    previewSize: { width: 120, height: 80 },
    render: (tokens, state) => HeadlessCard({ tokens, state }),
  },
  {
    concept: 'input',
    component: 'input',
    tokenProperties: ['bg', 'text', 'border', 'placeholder'],
    previewSize: { width: 120, height: 32 },
    render: (tokens, state) => HeadlessInput({ tokens, state }),
  },
];

/**
 * Get a headless component by concept and component name
 */
export function getHeadlessComponent(
  concept: Concept,
  component: string
): HeadlessComponentEntry | undefined {
  return headlessRegistry.find(
    (entry) => entry.concept === concept && entry.component === component
  );
}

/**
 * Get all headless components for a concept
 */
export function getHeadlessComponentsByConcept(concept: Concept): HeadlessComponentEntry[] {
  return headlessRegistry.filter((entry) => entry.concept === concept);
}

/**
 * Get all available component names
 */
export function getAvailableComponents(): Array<{ concept: Concept; component: string }> {
  return headlessRegistry.map(({ concept, component }) => ({ concept, component }));
}
