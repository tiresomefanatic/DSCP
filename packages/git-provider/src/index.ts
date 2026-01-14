/**
 * Git Provider Package
 *
 * This package provides an abstraction layer for Git operations,
 * enabling easy switching between GitHub and Azure DevOps.
 */

export { createGitProvider } from './factory';
export type { GitProvider, GitProviderConfig } from '@dscp/types';

// Re-export all git-related types for convenience
export type {
  Branch,
  Commit,
  PullRequest,
  PullRequestStatus,
  FileDiff,
  Diff,
} from '@dscp/types';
