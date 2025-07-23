import express, { Request, Response, Router } from 'express';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { GetCurrentUserProfileUseCase } from '../../../usecases/user/GetCurrentUserProfileUseCase';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';

/**
 * Create an Express router exposing user-related routes.
 *
 * @param authService - Service used to authenticate requests.
 * @param userRepository - Repository for user retrieval.
 */
interface AuthedRequest extends Request {
  user: User;
}

export function createUserRouter(
  authService: AuthServicePort,
  userRepository: UserRepositoryPort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  const authMiddleware: express.RequestHandler = async (req, res, next) => {
    logger.debug('REST auth middleware', getContext());
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).end();
      return;
    }
    const token = header.slice(7);
    try {
      const user = await authService.verifyToken(token);
      (req as AuthedRequest).user = user;
      logger.debug('REST auth success', getContext());
      next();
    } catch {
      logger.warn('REST auth failed', getContext());
      res.status(401).end();
    }
  };

  router.use(authMiddleware);

  router.get('/users/me', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /users/me', getContext());
    const useCase = new GetCurrentUserProfileUseCase(userRepository);
    const user = await useCase.execute((req as AuthedRequest).user.id);
    if (!user) {
      logger.warn('Current user not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Current user returned', getContext());
    res.json(user);
  });

  return router;
}
