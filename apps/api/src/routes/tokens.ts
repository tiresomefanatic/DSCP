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

    // Read current tokens with retry for newly created branches
    // GitHub branch creation is async and files may not be immediately available
    let content: string = '';
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        content = await req.gitProvider.readFile({
          branch,
          path: 'tokens.json',
        });
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          // If branch read fails, try reading from dev as fallback for new branches
          console.log(`Failed to read from ${branch}, falling back to dev`);
          content = await req.gitProvider.readFile({
            branch: 'dev',
            path: 'tokens.json',
          });
          break;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * attempts));
      }
    }

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

    // Validate after update - compare with original validation
    // Only block if we're introducing NEW errors
    const contentDev = await req.gitProvider.readFile({
      branch: 'dev',
      path: 'tokens.json',
    });
    const origTokensFile: TokensFile = JSON.parse(contentDev);
    const origParser = new TokenParser(origTokensFile);
    const origResolver = new TokenResolver(origParser.parseAll());
    const originalValidation = origResolver.validate();
    const originalErrors = new Set(originalValidation.errors.map(e => e.path + ':' + e.type));

    const validation = resolver.validate();
    const newErrors = validation.errors.filter(e => !originalErrors.has(e.path + ':' + e.type));
    
    if (newErrors.length > 0) {
      console.error('Token validation failed with NEW errors:', JSON.stringify(newErrors, null, 2));
      return res.status(400).json({
        error: 'Validation failed',
        errors: newErrors,
      });
    }
    
    if (validation.errors.length > 0) {
      console.warn('Pre-existing validation issues (not blocking):', JSON.stringify(validation.errors, null, 2));
    }

    // Verify that the change is valid in the resolver
    if (!updated) {
       return res.status(404).json({ error: 'Token not found' });
    }

    // Now update the source tokensFile object to persist the change
    // We need to traverse the JSON structure to find the token and update its value
    // This mirrors the logic in TokenParser but for writing
    
    // 1. Find the collection
    const collection = tokensFile.collections.find(c => c.name === updated.collection);
    if (!collection) {
      console.error(`Collection ${updated.collection} not found in tokens file`);
      return res.status(500).json({ error: 'Collection structure mismatch' });
    }

    // 2. Walk the path to find the variable
    // The path in resolved token (e.g. "radius/small") corresponds to nested keys in variables
    const pathParts = updated.path.split('/');
    let current: any = collection.variables;
    
    // Navigate to the parent of the token
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        // Should not happen if resolver found it
        console.error(`Path part ${part} not found in collection ${updated.collection}`);
        return res.status(500).json({ error: 'Token path mismatch' });
      }
      current = current[part];
    }
    
    // 3. Get the token variable
    const tokenName = pathParts[pathParts.length - 1];
    const variable = current[tokenName];
    
    if (!variable || !variable.values) {
       console.error(`Variable ${tokenName} not found or invalid`);
       return res.status(500).json({ error: 'Token variable mismatch' });
    }

    // 4. Update the value based on mode
    if (updated.tier === 'global') {
      variable.values.Default = newValue;
    } else {
      // Determine which mode key to update
      // Logic mirrors TokenParser.createToken handling of modes
      if (mode === 'light' || (!mode && updated.values?.light !== undefined)) {
        variable.values.Light = newValue;
      } 
      if (mode === 'dark' || (!mode && updated.values?.dark !== undefined)) {
        variable.values.Dark = newValue;
      }
      // If specific mode wasn't requested and it's not global, we might need to be careful.
      // But usually the UI sends a specific mode for non-global tokens.
      // If mode is undefined for a non-global token, it might be an ambiguous update.
      // However, usually 'light' is the default for display if mode is missing.
    }

    const commitMessage = `Update ${tokenPath}${mode ? ` (${mode})` : ''} to ${newValue}`;

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
