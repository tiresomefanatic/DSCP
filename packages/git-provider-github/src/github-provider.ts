import { Octokit } from '@octokit/rest';
import type {
  GitProvider,
  GitHubProviderConfig,
  Branch,
  Commit,
  PullRequest,
  PullRequestStatus,
  Diff,
  FileDiff,
} from '@dscp/types';

/**
 * GitHub implementation of GitProvider
 * Uses Octokit for all GitHub API operations
 */
export class GitHubProvider implements GitProvider {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubProviderConfig) {
    this.octokit = new Octokit({ auth: config.token });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  async createBranch(params: { baseBranch: string; newBranch: string }): Promise<void> {
    // Get the SHA of the base branch
    const { data: ref } = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${params.baseBranch}`,
    });

    // Create new branch pointing to same commit
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${params.newBranch}`,
      sha: ref.object.sha,
    });
  }

  async listBranches(): Promise<Branch[]> {
    const { data: branches } = await this.octokit.repos.listBranches({
      owner: this.owner,
      repo: this.repo,
      per_page: 100,
    });

    // Get default branch
    const { data: repoData } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo,
    });

    return branches.map((branch) => ({
      name: branch.name,
      sha: branch.commit.sha,
      isDefault: branch.name === repoData.default_branch,
      isProtected: branch.protected,
    }));
  }

  async deleteBranch(name: string): Promise<void> {
    await this.octokit.git.deleteRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${name}`,
    });
  }

  async readFile(params: { branch: string; path: string }): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: params.path,
      ref: params.branch,
    });

    if (Array.isArray(data)) {
      throw new Error(`Path ${params.path} is a directory, not a file`);
    }

    if (data.type !== 'file' || !('content' in data)) {
      throw new Error(`Path ${params.path} is not a file`);
    }

    // Content is base64 encoded
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  async writeFile(params: {
    branch: string;
    path: string;
    content: string;
    message: string;
  }): Promise<Commit> {
    // Check if file exists to get its SHA
    let sha: string | undefined;
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: params.path,
        ref: params.branch,
      });

      if (!Array.isArray(data) && 'sha' in data) {
        sha = data.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine for new files
      if ((error as { status?: number }).status !== 404) {
        throw error;
      }
    }

    // Create or update file
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: params.path,
      message: params.message,
      content: Buffer.from(params.content).toString('base64'),
      branch: params.branch,
      sha,
    });

    return {
      sha: data.commit.sha,
      message: data.commit.message || params.message,
      author: data.commit.author?.name || 'Unknown',
      date: new Date(data.commit.author?.date || Date.now()),
    };
  }

  async createPR(params: {
    sourceBranch: string;
    targetBranch: string;
    title: string;
    description: string;
  }): Promise<PullRequest> {
    const { data } = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      head: params.sourceBranch,
      base: params.targetBranch,
      title: params.title,
      body: params.description,
    });

    return this.mapPullRequest(data);
  }

  async listPRs(params?: { status?: PullRequestStatus }): Promise<PullRequest[]> {
    const state = params?.status === 'merged' ? 'closed' : params?.status || 'open';

    const { data } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: state as 'open' | 'closed' | 'all',
      per_page: 100,
    });

    let prs = data.map((pr) => this.mapPullRequest(pr));

    // Filter merged PRs if specifically requested
    if (params?.status === 'merged') {
      prs = prs.filter((pr) => pr.status === 'merged');
    }

    return prs;
  }

  async getPR(prNumber: number): Promise<PullRequest> {
    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return this.mapPullRequest(data);
  }

  async getDiff(params: {
    baseBranch: string;
    headBranch: string;
    path?: string;
  }): Promise<Diff> {
    const { data } = await this.octokit.repos.compareCommits({
      owner: this.owner,
      repo: this.repo,
      base: params.baseBranch,
      head: params.headBranch,
    });

    let files: FileDiff[] =
      data.files?.map((file) => ({
        path: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      })) || [];

    // Filter to specific path if provided
    if (params.path) {
      files = files.filter((f) => f.path === params.path);
    }

    return {
      baseBranch: params.baseBranch,
      headBranch: params.headBranch,
      files,
    };
  }

  async mergePR(prNumber: number): Promise<void> {
    await this.octokit.pulls.merge({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });
  }

  /**
   * Map GitHub PR data to our PullRequest type
   */
  private mapPullRequest(
    pr: Awaited<ReturnType<typeof this.octokit.pulls.get>>['data']
  ): PullRequest {
    let status: PullRequestStatus = 'open';
    if (pr.merged_at) {
      status = 'merged';
    } else if (pr.state === 'closed') {
      status = 'closed';
    }

    return {
      id: pr.number,
      title: pr.title,
      description: pr.body || '',
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      status,
      author: pr.user?.login || 'Unknown',
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
      url: pr.html_url,
    };
  }
}
