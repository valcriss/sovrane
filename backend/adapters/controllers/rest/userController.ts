import express, { Request, Response, Router } from 'express';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { GetCurrentUserProfileUseCase } from '../../../usecases/user/GetCurrentUserProfileUseCase';
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

export function createUserRouter(authService: AuthServicePort, userRepository: UserRepositoryPort): Router {
  const router = express.Router();

  const authMiddleware: express.RequestHandler = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).end();
      return;
    }
    const token = header.slice(7);
    try {
      const user = await authService.verifyToken(token);
      (req as AuthedRequest).user = user;
      next();
    } catch {
      res.status(401).end();
    }
  };

  router.use(authMiddleware);

  router.get('/users/me', async (req: Request, res: Response): Promise<void> => {
    const useCase = new GetCurrentUserProfileUseCase(userRepository);
    const user = await useCase.execute((req as AuthedRequest).user.id);
    if (!user) {
      res.status(404).end();
      return;
    }
    res.json(user);
  });

  return router;
}
