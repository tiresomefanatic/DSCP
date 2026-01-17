import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Create branch schema - default base is now 'dev' for feature branches
const createBranchSchema = z.object({
  baseBranch: z.string().default('dev'),
  newBranch: z.string(),
});

// Compare branches schema
const compareBranchesSchema = z.object({
  base: z.string().default('dev'),
});

/**
 * GET /api/branches
 * List all branches
 */
router.get('/', async (req, res, next) => {
  try {
    const branches = await req.gitProvider.listBranches();
    res.json({ branches });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/branches/:name/compare
 * Get commits ahead/behind compared to base branch
 * Used to detect if a feature branch has changes
 */
router.get('/:name/compare', async (req, res, next) => {
  try {
    const branchName = req.params.name;
    const { base } = compareBranchesSchema.parse(req.query);

    const comparison = await req.gitProvider.getCommitsAhead({
      baseBranch: base,
      headBranch: branchName,
    });

    res.json({
      branch: branchName,
      baseBranch: base,
      ...comparison,
      hasChanges: comparison.ahead > 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branches
 * Create a new branch
 */
router.post('/', async (req, res, next) => {
  try {
    const { baseBranch, newBranch } = createBranchSchema.parse(req.body);

    await req.gitProvider.createBranch({
      baseBranch,
      newBranch,
    });

    // Get the newly created branch
    const branches = await req.gitProvider.listBranches();
    const branch = branches.find((b) => b.name === newBranch);

    res.status(201).json({ branch });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/branches/:name
 * Delete a branch
 */
router.delete('/:name', async (req, res, next) => {
  try {
    const branchName = req.params.name;

    // Prevent deleting protected branches
    const branches = await req.gitProvider.listBranches();
    const branch = branches.find((b) => b.name === branchName);

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    if (branch.isProtected || branch.isDefault) {
      return res.status(403).json({ error: 'Cannot delete protected or default branch' });
    }

    await req.gitProvider.deleteBranch(branchName);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as branchRoutes };

