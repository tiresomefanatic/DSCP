import { Router } from 'express';
import { z } from 'zod';
import { TokenParser, TokenResolver } from '@dscp/token-resolver';
import type { TokensFile, TokenChange, TokenMode } from '@dscp/types';

const router = Router();

// Create PR schema
const createPRSchema = z.object({
  sourceBranch: z.string(),
  targetBranch: z.string().default('main'),
  title: z.string(),
  description: z.string().optional(),
});

/**
 * GET /api/pull-requests
 * List open pull requests
 */
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as 'open' | 'closed' | 'merged' | undefined;
    const prs = await req.gitProvider.listPRs({ status });
    res.json({ pullRequests: prs });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pull-requests
 * Create a new pull request
 */
router.post('/', async (req, res, next) => {
  try {
    const { sourceBranch, targetBranch, title, description } = createPRSchema.parse(
      req.body
    );

    const pr = await req.gitProvider.createPR({
      sourceBranch,
      targetBranch,
      title,
      description: description || '',
    });

    res.status(201).json({ pullRequest: pr });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pull-requests/:number
 * Get pull request details with token diff
 */
router.get('/:number', async (req, res, next) => {
  try {
    const prNumber = parseInt(req.params.number, 10);

    const pr = await req.gitProvider.getPR(prNumber);
    const diff = await req.gitProvider.getDiff({
      baseBranch: pr.targetBranch,
      headBranch: pr.sourceBranch,
      path: 'tokens.json',
    });

    // Calculate token-level changes
    let tokenChanges: TokenChange[] = [];

    try {
      // Get tokens from both branches
      const [baseContent, headContent] = await Promise.all([
        req.gitProvider.readFile({ branch: pr.targetBranch, path: 'tokens.json' }),
        req.gitProvider.readFile({ branch: pr.sourceBranch, path: 'tokens.json' }),
      ]);

      const baseTokens = new TokenParser(JSON.parse(baseContent) as TokensFile)
        .parseAll();
      const headTokens = new TokenParser(JSON.parse(headContent) as TokensFile)
        .parseAll();

      const baseResolver = new TokenResolver(baseTokens);
      const headResolver = new TokenResolver(headTokens);

      // Find changes
      const allPaths = new Set([
        ...baseTokens.map((t) => t.path),
        ...headTokens.map((t) => t.path),
      ]);

      for (const path of allPaths) {
        const baseToken = baseResolver.get(path);
        const headToken = headResolver.get(path);

        if (!baseToken && headToken) {
          // New token
          tokenChanges.push({
            path,
            type: headToken.type,
            oldValue: null,
            newValue: headToken.tier === 'global' ? headToken.value! : headToken.values?.light!,
          });
        } else if (baseToken && !headToken) {
          // Deleted token
          tokenChanges.push({
            path,
            type: baseToken.type,
            oldValue: baseToken.tier === 'global' ? baseToken.value! : baseToken.values?.light!,
            newValue: null as unknown as string | number,
          });
        } else if (baseToken && headToken) {
          // Check for changes in each mode
          const modes: TokenMode[] =
            baseToken.tier === 'global' ? ['light'] : ['light', 'dark'];

          for (const mode of modes) {
            const oldValue =
              baseToken.tier === 'global' ? baseToken.value : baseToken.values?.[mode];
            const newValue =
              headToken.tier === 'global' ? headToken.value : headToken.values?.[mode];

            if (oldValue !== newValue) {
              tokenChanges.push({
                path,
                type: headToken.type,
                mode: baseToken.tier !== 'global' ? mode : undefined,
                oldValue: oldValue!,
                newValue: newValue!,
                oldResolved: baseResolver.resolve(path, mode),
                newResolved: headResolver.resolve(path, mode),
              });
            }
          }
        }
      }
    } catch {
      // If we can't parse tokens, just show file-level diff
    }

    res.json({
      pullRequest: pr,
      diff: {
        ...diff,
        tokenChanges,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pull-requests/:number/merge
 * Merge a pull request
 */
router.post('/:number/merge', async (req, res, next) => {
  try {
    const prNumber = parseInt(req.params.number, 10);

    // Get PR to check status
    const pr = await req.gitProvider.getPR(prNumber);

    if (pr.status !== 'open') {
      return res.status(400).json({
        error: `Cannot merge PR with status: ${pr.status}`,
      });
    }

    await req.gitProvider.mergePR(prNumber);

    // Get updated PR
    const updatedPR = await req.gitProvider.getPR(prNumber);

    res.json({ pullRequest: updatedPR });
  } catch (error) {
    next(error);
  }
});

export { router as prRoutes };
