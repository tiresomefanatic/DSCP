const EDITING_DISABLED_BRANCHES = new Set(['main', 'stage', 'dev']);

export function isEditingDisabledBranch(branchName: string): boolean {
  return EDITING_DISABLED_BRANCHES.has(branchName.trim().toLowerCase());
}
