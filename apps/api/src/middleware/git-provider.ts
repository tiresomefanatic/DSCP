import type { Request, Response, NextFunction } from 'express';
import type { GitProvider } from '@dscp/types';

// Extend Express Request to include gitProvider
declare global {
  namespace Express {
    interface Request {
      gitProvider: GitProvider;
    }
  }
}

/**
 * Middleware to inject GitProvider into requests
 */
export function gitProviderMiddleware(provider: GitProvider) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.gitProvider = provider;
    next();
  };
}
