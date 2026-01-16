/**
 * Git Provider Types
 * Abstract types for Git operations that work across GitHub and Azure DevOps
 */

export interface Branch {
  name: string;
  sha: string;
  isDefault: boolean;
  isProtected: boolean;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: Date;
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: PullRequestStatus;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  url: string;
}

export type PullRequestStatus = 'open' | 'closed' | 'merged';

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface Diff {
  baseBranch: string;
  headBranch: string;
  files: FileDiff[];
  /** Parsed token changes for visual diff */
  tokenChanges?: import('./tokens').TokenChange[];
}

/**
 * Git Provider Interface
 * Abstraction layer for Git operations
 */
export interface GitProvider {
  /**
   * Create a new branch from a base branch
   */
  createBranch(params: {
    baseBranch: string;
    newBranch: string;
  }): Promise<void>;

  /**
   * List all branches in the repository
   */
  listBranches(): Promise<Branch[]>;

  /**
   * Delete a branch
   */
  deleteBranch(name: string): Promise<void>;

  /**
   * Read file contents from a branch
   */
  readFile(params: {
    branch: string;
    path: string;
  }): Promise<string>;

  /**
   * Write/update a file on a branch
   */
  writeFile(params: {
    branch: string;
    path: string;
    content: string;
    message: string;
  }): Promise<Commit>;

  /**
   * Create a pull request
   */
  createPR(params: {
    sourceBranch: string;
    targetBranch: string;
    title: string;
    description: string;
  }): Promise<PullRequest>;

  /**
   * List open pull requests
   */
  listPRs(params?: {
    status?: PullRequestStatus;
  }): Promise<PullRequest[]>;

  /**
   * Get a specific pull request
   */
  getPR(prNumber: number): Promise<PullRequest>;

  /**
   * Get diff between two branches
   */
  getDiff(params: {
    baseBranch: string;
    headBranch: string;
    path?: string;
  }): Promise<Diff>;

  /**
   * Get number of commits branch is ahead of base branch
   */
  getCommitsAhead(params: {
    baseBranch: string;
    headBranch: string;
  }): Promise<{ ahead: number; behind: number }>;

  /**
   * Merge a pull request
   */
  mergePR(prNumber: number): Promise<void>;
}

/**
 * Git Provider Configuration
 */
export type GitProviderConfig =
  | GitHubProviderConfig
  | AzureProviderConfig
  | LocalProviderConfig;

export interface GitHubProviderConfig {
  type: 'github';
  token: string;
  owner: string;
  repo: string;
}

export interface AzureProviderConfig {
  type: 'azure';
  token: string;
  organization: string;
  project: string;
  repo: string;
}

export interface LocalProviderConfig {
  type: 'local';
  basePath: string;
  tokensFile?: string;
}
