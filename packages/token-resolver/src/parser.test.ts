import { describe, it, expect } from 'vitest';
import { TokenParser } from './parser';
import type { TokensFile } from '@dscp/types';

describe('TokenParser', () => {
  const mockTokensFile: TokensFile = {
    collections: [
      {
        name: 'Global',
        modes: ['Default'],
        variables: {
          color: {
            white: {
              type: 'color',
              values: { Default: '#ffffff' },
            },
          },
        },
      },
      {
        name: 'Brand',
        modes: ['ACPD', 'EEAA'],
        variables: {
          acpd: {
            primary: {
              type: 'color',
              values: { ACPD: '#000000', EEAA: '#ffffff' }, // Logic in parser extracts brand from path
            },
          },
        },
      },
      {
        name: 'Prominence', // Shared component collection
        modes: ['Dark', 'Light'],
        variables: {
          Button: {
            bg: {
              type: 'color',
              values: { Dark: '#000', Light: '#fff' },
            },
          },
        },
      },
    ],
  };

  it('should include shared component tokens when parsing by brand', () => {
    const parser = new TokenParser(mockTokensFile);
    const tokens = parser.parseByBrand('acpd');

    // Should have Global token
    expect(tokens.find(t => t.collection === 'Global')).toBeDefined();

    // Should have Brand token
    // Note: In the real implementation, 'acpd' path segment sets the brand. 
    // My mock above might ideally need deeper structure to fully match 'Brand' collection parsing logic 
    // if I was testing that specifically, but here I care about 'Prominence'.
    
    // Should have Prominence token (Shared)
    // This is currently FAILING because Prominence tokens have brand: null
    const prominenceToken = tokens.find(t => t.collection === 'Prominence');
    expect(prominenceToken).toBeDefined();
    expect(prominenceToken?.id).toContain('Prominence:Button/bg');
  });
});
