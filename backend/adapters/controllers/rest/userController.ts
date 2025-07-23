import express, { Request, Response, Router } from 'express';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { GetCurrentUserProfileUseCase } from '../../../usecases/user/GetCurrentUserProfileUseCase';
import { RegisterUserUseCase } from '../../../usecases/user/RegisterUserUseCase';
import { AuthenticateUserUseCase } from '../../../usecases/user/AuthenticateUserUseCase';
import { AuthenticateWithProviderUseCase } from '../../../usecases/user/AuthenticateWithProviderUseCase';
import { RequestPasswordResetUseCase } from '../../../usecases/user/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../usecases/user/ResetPasswordUseCase';
import { UpdateUserProfileUseCase } from '../../../usecases/user/UpdateUserProfileUseCase';
import { ChangeUserStatusUseCase } from '../../../usecases/user/ChangeUserStatusUseCase';
import { RemoveUserUseCase } from '../../../usecases/user/RemoveUserUseCase';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';

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

  interface UserPayload {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles?: Array<{ id: string; label: string }>;
    status?: 'active' | 'suspended' | 'archived';
    department: {
      id: string;
      label: string;
      parentDepartmentId?: string | null;
      managerUserId?: string | null;
      site: { id: string; label: string };
    };
    site: { id: string; label: string };
    picture?: string;
    permissions?: Array<{ id: string; permissionKey: string; description: string }>;
  }

  /* istanbul ignore next */
  function parseUser(body: UserPayload): User {
    return new User(
      body.id,
      body.firstName,
      body.lastName,
      body.email,
      (body.roles ?? []).map((r) => new Role(r.id, r.label)),
      body.status ?? 'active',
      new Department(
        body.department.id,
        body.department.label,
        body.department.parentDepartmentId ?? null,
        body.department.managerUserId ?? null,
        new Site(body.department.site.id, body.department.site.label),
      ),
      new Site(body.site.id, body.site.label),
      body.picture,
      (body.permissions ?? []).map(
        (p) => new Permission(p.id, p.permissionKey, p.description),
      ),
    );
  }

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

  router.post('/users', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /users', getContext());
    const useCase = new RegisterUserUseCase(userRepository);
    const user = await useCase.execute(parseUser(req.body));
    logger.debug('User registered', getContext());
    res.status(201).json(user);
  });

  router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /auth/login', getContext());
    const { email, password } = req.body;
    const useCase = new AuthenticateUserUseCase(authService);
    try {
      const user = await useCase.execute(email, password);
      logger.debug('User authenticated', getContext());
      res.json(user);
    } catch (err) {
      logger.warn('Authentication failed', { ...getContext(), error: err });
      res.status(401).json({ error: (err as Error).message });
    }
  });

  router.post('/auth/provider', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /auth/provider', getContext());
    const { provider, token } = req.body;
    const useCase = new AuthenticateWithProviderUseCase(authService);
    try {
      const user = await useCase.execute(provider, token);
      logger.debug('Provider auth success', getContext());
      res.json(user);
    } catch (err) {
      logger.warn('Provider auth failed', { ...getContext(), error: err });
      res.status(401).json({ error: (err as Error).message });
    }
  });

  router.post('/auth/request-reset', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /auth/request-reset', getContext());
    const { email } = req.body;
    const useCase = new RequestPasswordResetUseCase(authService);
    await useCase.execute(email);
    logger.debug('Password reset requested', getContext());
    res.status(204).end();
  });

  router.post('/auth/reset', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /auth/reset', getContext());
    const { token, password } = req.body;
    const useCase = new ResetPasswordUseCase(authService);
    await useCase.execute(token, password);
    logger.debug('Password reset performed', getContext());
    res.status(204).end();
  });

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

  router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /users/:id', getContext());
    const user = parseUser({ ...req.body, id: req.params.id });
    const useCase = new UpdateUserProfileUseCase(userRepository);
    const updated = await useCase.execute(user);
    logger.debug('User profile updated', getContext());
    res.json(updated);
  });

  router.put('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /users/:id/status', getContext());
    const { status } = req.body;
    const useCase = new ChangeUserStatusUseCase(userRepository);
    const updated = await useCase.execute(req.params.id, status);
    if (!updated) {
      logger.warn('User not found for status change', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('User status changed', getContext());
    res.json(updated);
  });

  router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /users/:id', getContext());
    const useCase = new RemoveUserUseCase(userRepository);
    await useCase.execute(req.params.id);
    logger.debug('User removed', getContext());
    res.status(204).end();
  });

  return router;
}
