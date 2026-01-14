import type {
  ResolvedToken,
  Branch,
  PullRequest,
  TokenTreeNode,
  TokenValidationResult,
  TokenChange,
} from '@dscp/types';

const API_BASE = '/api';

// Token API
export async function fetchTokens(params: {
  branch: string;
  brand?: string;
  mode?: string;
}): Promise<{
  tokens: ResolvedToken[];
  resolved: Record<string, string | number | null>;
  resolvedLight: Record<string, string | number | null>;
  resolvedDark: Record<string, string | number | null>;
  validation: TokenValidationResult;
}> {
  const searchParams = new URLSearchParams();
  searchParams.set('branch', params.branch);
  if (params.brand) searchParams.set('brand', params.brand);
  if (params.mode) searchParams.set('mode', params.mode);

  const res = await fetch(`${API_BASE}/tokens?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch tokens');
  return res.json();
}

export async function fetchTokenTree(params: {
  branch: string;
  brand?: string;
}): Promise<{ tree: TokenTreeNode }> {
  const searchParams = new URLSearchParams();
  searchParams.set('branch', params.branch);
  if (params.brand) searchParams.set('brand', params.brand);

  const res = await fetch(`${API_BASE}/tokens/tree?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch token tree');
  return res.json();
}

export async function updateToken(params: {
  branch: string;
  tokenPath: string;
  mode?: string;
  value: string | number;
  isAlias?: boolean;
}): Promise<{ token: ResolvedToken }> {
  const res = await fetch(`${API_BASE}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to update token');
  return res.json();
}

// Branch API
export async function fetchBranches(): Promise<{ branches: Branch[] }> {
  const res = await fetch(`${API_BASE}/branches`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

export async function createBranch(params: {
  baseBranch: string;
  newBranch: string;
}): Promise<{ branch: Branch }> {
  const res = await fetch(`${API_BASE}/branches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to create branch');
  return res.json();
}

export async function deleteBranch(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/branches/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete branch');
}

// Pull Request API
export async function fetchPullRequests(params?: {
  status?: string;
}): Promise<{ pullRequests: PullRequest[] }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);

  const res = await fetch(`${API_BASE}/pull-requests?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch pull requests');
  return res.json();
}

export async function createPullRequest(params: {
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description?: string;
}): Promise<{ pullRequest: PullRequest }> {
  const res = await fetch(`${API_BASE}/pull-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to create pull request');
  return res.json();
}

export async function fetchPullRequest(
  prNumber: number
): Promise<{
  pullRequest: PullRequest;
  diff: { tokenChanges: TokenChange[] };
}> {
  const res = await fetch(`${API_BASE}/pull-requests/${prNumber}`);
  if (!res.ok) throw new Error('Failed to fetch pull request');
  return res.json();
}

export async function mergePullRequest(
  prNumber: number
): Promise<{ pullRequest: PullRequest }> {
  const res = await fetch(`${API_BASE}/pull-requests/${prNumber}/merge`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to merge pull request');
  return res.json();
}
