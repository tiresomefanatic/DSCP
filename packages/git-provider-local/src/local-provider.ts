import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import type {
  GitProvider,
  Branch,
  Commit,
  PullRequest,
  PullRequestStatus,
  Diff,
} from '@dscp/types';

export interface LocalProviderConfig {
  /** Base directory for the "repository" */
  basePath: string;
  /** Path to the tokens file within basePath */
  tokensFile?: string;
}

/**
 * LocalFileProvider - A file-based Git provider for local development/testing
 *
 * This provider simulates Git operations using the local filesystem.
 * Branches are simulated as subdirectories.
 */
export class LocalFileProvider implements GitProvider {
  private basePath: string;
  private tokensFile: string;
  private branches: Map<string, Branch>;
  private pullRequests: Map<number, PullRequest>;
  private prCounter: number;

  constructor(config: LocalProviderConfig) {
    this.basePath = config.basePath;
    this.tokensFile = config.tokensFile || 'tokens.json';
    this.branches = new Map([
      ['main', { name: 'main', sha: 'local-main', isDefault: true, isProtected: true }],
    ]);
    this.pullRequests = new Map();
    this.prCounter = 1;
  }

  async createBranch(params: { baseBranch: string; newBranch: string }): Promise<void> {
    if (!this.branches.has(params.baseBranch)) {
      throw new Error(`Base branch ${params.baseBranch} does not exist`);
    }

    this.branches.set(params.newBranch, {
      name: params.newBranch,
      sha: `local-${params.newBranch}-${Date.now()}`,
      isDefault: false,
      isProtected: false,
    });

    // Create branch directory and copy tokens file
    const branchDir = join(this.basePath, 'branches', params.newBranch);
    await mkdir(branchDir, { recursive: true });

    // Copy tokens file to branch
    const sourceFile = await this.getFilePath(params.baseBranch);
    if (existsSync(sourceFile)) {
      const content = await readFile(sourceFile, 'utf-8');
      await writeFile(join(branchDir, this.tokensFile), content);
    }
  }

  async listBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async deleteBranch(name: string): Promise<void> {
    const branch = this.branches.get(name);
    if (!branch) {
      throw new Error(`Branch ${name} does not exist`);
    }
    if (branch.isDefault || branch.isProtected) {
      throw new Error(`Cannot delete protected branch ${name}`);
    }
    this.branches.delete(name);
  }

  async readFile(params: { branch: string; path: string }): Promise<string> {
    const filePath = await this.getFilePath(params.branch, params.path);
    return readFile(filePath, 'utf-8');
  }

  async writeFile(params: {
    branch: string;
    path: string;
    content: string;
    message: string;
  }): Promise<Commit> {
    const filePath = await this.getFilePath(params.branch, params.path);

    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, params.content);

    const sha = `commit-${Date.now()}`;

    // Update branch SHA
    const branch = this.branches.get(params.branch);
    if (branch) {
      branch.sha = sha;
    }

    return {
      sha,
      message: params.message,
      author: 'local-user',
      date: new Date(),
    };
  }

  async createPR(params: {
    sourceBranch: string;
    targetBranch: string;
    title: string;
    description: string;
  }): Promise<PullRequest> {
    const id = this.prCounter++;
    const pr: PullRequest = {
      id,
      title: params.title,
      description: params.description,
      sourceBranch: params.sourceBranch,
      targetBranch: params.targetBranch,
      status: 'open',
      author: 'local-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      url: `local://pr/${id}`,
    };

    this.pullRequests.set(id, pr);
    return pr;
  }

  async listPRs(params?: { status?: PullRequestStatus }): Promise<PullRequest[]> {
    let prs = Array.from(this.pullRequests.values());
    if (params?.status) {
      prs = prs.filter((pr) => pr.status === params.status);
    }
    return prs;
  }

  async getPR(prNumber: number): Promise<PullRequest> {
    const pr = this.pullRequests.get(prNumber);
    if (!pr) {
      throw new Error(`PR #${prNumber} not found`);
    }
    return pr;
  }

  async getDiff(params: {
    baseBranch: string;
    headBranch: string;
    path?: string;
  }): Promise<Diff> {
    // For local provider, return a simple diff structure
    return {
      baseBranch: params.baseBranch,
      headBranch: params.headBranch,
      files: [
        {
          path: params.path || this.tokensFile,
          additions: 0,
          deletions: 0,
        },
      ],
    };
  }

  async mergePR(prNumber: number): Promise<void> {
    const pr = this.pullRequests.get(prNumber);
    if (!pr) {
      throw new Error(`PR #${prNumber} not found`);
    }

    // Copy source branch file to target branch
    const sourceContent = await this.readFile({
      branch: pr.sourceBranch,
      path: this.tokensFile,
    });

    await this.writeFile({
      branch: pr.targetBranch,
      path: this.tokensFile,
      content: sourceContent,
      message: `Merge PR #${prNumber}: ${pr.title}`,
    });

    pr.status = 'merged';
    pr.mergedAt = new Date();
    pr.updatedAt = new Date();
  }

  /**
   * Get the file path for a branch
   */
  private async getFilePath(branch: string, path?: string): Promise<string> {
    const fileName = path || this.tokensFile;

    // For 'main' branch, use the base file directly
    if (branch === 'main') {
      return join(this.basePath, fileName);
    }

    // For other branches, use the branches subdirectory
    return join(this.basePath, 'branches', branch, fileName);
  }
}
