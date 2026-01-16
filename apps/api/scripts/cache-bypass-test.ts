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
  const baseBranch = branches.find((b) => b.isDefault)?.name || 'main';
  const testBranch = `cache-bypass-test-${Date.now()}`;
  const shouldCleanup = process.env.CLEANUP_BRANCH === 'true';

  console.log(`Base: ${baseBranch}`);
  console.log(`Creating branch: ${testBranch}`);
  await provider.createBranch({ baseBranch, newBranch: testBranch });

  // Read fresh content from the new branch
  const original = await provider.readFile({ branch: testBranch, path: 'tokens.json' });

  // Add a harmless trailing newline to force a content change
  const newContent = original.endsWith('\n') ? `${original}\n` : `${original}\n`;

  const commit = await provider.writeFile({
    branch: testBranch,
    path: 'tokens.json',
    content: newContent,
    message: `Cache bypass test ${new Date().toISOString()}`,
  });
  console.log(`Committed: ${commit.sha}`);

  // Immediate read after write to verify cache bypass
  const after = await provider.readFile({ branch: testBranch, path: 'tokens.json' });
  const matches = after === newContent;

  console.log(`Immediate read matches new content: ${matches}`);

  if (shouldCleanup) {
    await provider.deleteBranch(testBranch);
    console.log('Cleaned up test branch');
  } else {
    console.log(`Left test branch intact for inspection: ${testBranch}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
