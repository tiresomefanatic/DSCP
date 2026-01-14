import type { GitProvider, GitProviderConfig } from '@dscp/types';

/**
 * Factory function to create a GitProvider instance
 *
 * @param config - Provider configuration
 * @returns GitProvider instance
 *
 * @example
 * ```ts
 * // GitHub provider
 * const provider = await createGitProvider({
 *   type: 'github',
 *   token: process.env.GITHUB_TOKEN,
 *   owner: 'myorg',
 *   repo: 'design-tokens'
 * });
 *
 * // Local provider for testing
 * const localProvider = await createGitProvider({
 *   type: 'local',
 *   basePath: '/path/to/tokens',
 *   tokensFile: 'tokens.json'
 * });
 * ```
 */
export async function createGitProvider(config: GitProviderConfig): Promise<GitProvider> {
  switch (config.type) {
    case 'github': {
      const { GitHubProvider } = await import('@dscp/git-provider-github');
      return new GitHubProvider(config);
    }
    case 'local': {
      const { LocalFileProvider } = await import('@dscp/git-provider-local');
      return new LocalFileProvider(config);
    }
    case 'azure': {
      throw new Error('Azure DevOps provider not yet implemented');
    }
    default: {
      const exhaustiveCheck: never = config;
      throw new Error(`Unknown provider type: ${(exhaustiveCheck as GitProviderConfig).type}`);
    }
  }
}
