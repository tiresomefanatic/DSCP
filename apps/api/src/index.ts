import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createGitProvider } from '@dscp/git-provider';
import type { GitProviderConfig } from '@dscp/types';
import { gitProviderMiddleware } from './middleware/git-provider.js';
import { tokenRoutes } from './routes/tokens.js';
import { branchRoutes } from './routes/branches.js';
import { prRoutes } from './routes/pull-requests.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Git Provider
async function initializeApp() {
  let config: GitProviderConfig;

  // Use local provider if no GitHub token, otherwise use GitHub
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
    config = {
      type: 'github',
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
    };
    console.log(`Using GitHub provider: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);
  } else {
    // Use local provider for testing
    const basePath = process.env.TOKENS_PATH || process.cwd();
    config = {
      type: 'local',
      basePath,
      tokensFile: process.env.TOKENS_FILE || 'tokens.json',
    };
    console.log(`Using local provider: ${basePath}`);
  }

  const gitProvider = await createGitProvider(config);

  // Inject provider into requests
  app.use(gitProviderMiddleware(gitProvider));

  // Routes
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/pull-requests', prRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', provider: config.type });
  });

  // Error handler
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error(err.stack);
      res.status(500).json({
        error: err.message || 'Internal Server Error',
      });
    }
  );

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}

initializeApp().catch(console.error);
