import dotenv from 'dotenv';
import path from 'path';
import { createGitProvider } from '@dscp/git-provider';
import type { GitProviderConfig } from '@dscp/types';

// Load API env so we use the same repo/token as the app
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

async function main() {
  const token = requireEnv('GITHUB_TOKEN');
  const owner = requireEnv('GITHUB_OWNER');
  const repo = requireEnv('GITHUB_REPO');

  const config: GitProviderConfig = {
    type: 'github',
    token,
    owner,
    repo,
  };

  const provider = await createGitProvider(config);
  const branches = await provider.listBranches();

  console.log(`Found ${branches.length} branches`);

  for (const branch of branches) {
    const isMain = branch.name === 'main';
    if (isMain || branch.isDefault || branch.isProtected) {
      console.log(`Skipping protected/default branch: ${branch.name}`);
      continue;
    }

    try {
      await provider.deleteBranch(branch.name);
      console.log(`Deleted branch: ${branch.name}`);
    } catch (err) {
      console.error(`Failed to delete ${branch.name}:`, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
