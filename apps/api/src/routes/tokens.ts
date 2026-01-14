import { Router } from 'express';
import { z } from 'zod';
import { TokenParser, TokenResolver, buildTokenTree } from '@dscp/token-resolver';
import type { TokensFile, TokenBrand, TokenMode } from '@dscp/types';

const router = Router();

// Query params schema
const listTokensSchema = z.object({
  branch: z.string().default('main'),
  brand: z.enum(['acpd', 'eeaa']).optional(),
  mode: z.enum(['light', 'dark']).default('light'),
});

// Update token schema
const updateTokenSchema = z.object({
  branch: z.string(),
  tokenPath: z.string(),
  mode: z.enum(['light', 'dark']).optional(),
  value: z.union([z.string(), z.number()]),
  isAlias: z.boolean().optional(),
});

/**
 * GET /api/tokens
 * List all tokens with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { branch, brand, mode } = listTokensSchema.parse(req.query);

    // Read tokens file from repository
    const content = await req.gitProvider.readFile({
      branch,
      path: 'tokens.json',
    });

    const tokensFile: TokensFile = JSON.parse(content);
    const parser = new TokenParser(tokensFile);

    const tokens = brand ? parser.parseByBrand(brand as TokenBrand) : parser.parseAll();

    const resolver = new TokenResolver(tokens);
    const validation = resolver.validate();

    // Get resolved values for both modes
    const resolvedLight = brand
      ? Object.fromEntries(resolver.resolveAll(brand as TokenBrand, 'light'))
      : {};
    const resolvedDark = brand
      ? Object.fromEntries(resolver.resolveAll(brand as TokenBrand, 'dark'))
      : {};

    // Return resolved for current mode for backward compatibility
    const resolved = mode === 'dark' ? resolvedDark : resolvedLight;

    res.json({
      tokens,
      resolved,
      resolvedLight,
      resolvedDark,
      validation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tokens/tree
 * Get token tree structure for UI navigation
 */
router.get('/tree', async (req, res, next) => {
  try {
    const { branch, brand } = listTokensSchema.parse(req.query);

    const content = await req.gitProvider.readFile({
      branch,
      path: 'tokens.json',
    });

    const tokensFile: TokensFile = JSON.parse(content);
    const parser = new TokenParser(tokensFile);

    const tokens = brand
      ? parser.parseByBrand(brand as TokenBrand)
      : parser.parseAll();

    const tree = buildTokenTree(tokens);

    res.json({ tree });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tokens/:path
 * Get a single token by path
 */
router.get('/:path(*)', async (req, res, next) => {
  try {
    const { branch, mode } = listTokensSchema.parse(req.query);
    const tokenPath = req.params.path;

    const content = await req.gitProvider.readFile({
      branch,
      path: 'tokens.json',
    });

    const tokensFile: TokensFile = JSON.parse(content);
    const parser = new TokenParser(tokensFile);
    const tokens = parser.parseAll();
    const resolver = new TokenResolver(tokens);

    const token = resolver.get(tokenPath);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const resolvedValue = resolver.resolve(tokenPath, mode as TokenMode);

    res.json({
      token,
      resolvedValue,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tokens
 * Update a token value
 */
router.post('/', async (req, res, next) => {
  try {
    const { branch, tokenPath, mode, value, isAlias } = updateTokenSchema.parse(req.body);

    // Read current tokens
    const content = await req.gitProvider.readFile({
      branch,
      path: 'tokens.json',
    });

    const tokensFile: TokensFile = JSON.parse(content);
    const parser = new TokenParser(tokensFile);
    const tokens = parser.parseAll();
    const resolver = new TokenResolver(tokens);

    // Get original token
    const token = resolver.get(tokenPath);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Prepare the value (add collection:path format for aliases)
    const newValue = isAlias ? value : value;

    // Update token
    const updated = resolver.update(tokenPath, newValue, mode as TokenMode | undefined);

    // Validate after update
    const validation = resolver.validate();
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Note: For full implementation, we'd need to update the original nested structure
    // and commit back. For now, this is a simplified version.
    const commitMessage = `Update ${tokenPath}${mode ? ` (${mode})` : ''}`;

    const commit = await req.gitProvider.writeFile({
      branch,
      path: 'tokens.json',
      content: JSON.stringify(tokensFile, null, 2),
      message: commitMessage,
    });

    res.json({
      token: updated,
      commit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tokens/validate
 * Validate tokens without making changes
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { branch } = z.object({ branch: z.string() }).parse(req.body);

    const content = await req.gitProvider.readFile({
      branch,
      path: 'tokens.json',
    });

    const tokensFile: TokensFile = JSON.parse(content);
    const parser = new TokenParser(tokensFile);
    const tokens = parser.parseAll();
    const resolver = new TokenResolver(tokens);

    const validation = resolver.validate();

    res.json(validation);
  } catch (error) {
    next(error);
  }
});

export { router as tokenRoutes };
