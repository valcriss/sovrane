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
 * @openapi
 * components:
 *   schemas:
 *     Site:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         label:
 *           type: string
 *       required:
 *         - id
 *         - label
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         label:
 *           type: string
 *         parentDepartmentId:
 *           type: string
 *           nullable: true
 *         managerUserId:
 *           type: string
 *           nullable: true
 *         site:
 *           $ref: '#/components/schemas/Site'
 *       required:
 *         - id
 *         - label
 *         - site
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         permissionKey:
 *           type: string
 *         description:
 *           type: string
 *       required:
 *         - id
 *         - permissionKey
 *         - description
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         label:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *       required:
 *         - id
 *         - label
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Role'
 *         status:
 *           type: string
 *           enum: [active, suspended, archived]
 *         department:
 *           $ref: '#/components/schemas/Department'
 *         site:
 *           $ref: '#/components/schemas/Site'
 *         picture:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *         - email
 *         - department
 *         - site
 */

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

  /**
   * @openapi
  * /users:
  *   post:
  *     summary: Register a new user.
   *     tags:
   *       - User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       201:
   *         description: User created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
  router.post('/users', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /users', getContext());
    const useCase = new RegisterUserUseCase(userRepository);
    const user = await useCase.execute(parseUser(req.body));
    logger.debug('User registered', getContext());
    res.status(201).json(user);
  });

  /**
   * @openapi
  * /auth/login:
  *   post:
  *     summary: Authenticate a user with email and password.
   *     tags:
   *       - User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *             required:
   *               - email
   *               - password
   *     responses:
   *       200:
   *         description: Authenticated user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
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

  /**
   * @openapi
  * /auth/provider:
  *   post:
  *     summary: Authenticate a user with an external provider.
   *     tags:
   *       - User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               provider:
   *                 type: string
   *               token:
   *                 type: string
   *             required:
   *               - provider
   *               - token
   *     responses:
   *       200:
   *         description: Authenticated user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
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

  /**
   * @openapi
  * /auth/request-reset:
  *   post:
  *     summary: Request a password reset email.
   *     tags:
   *       - User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *             required:
   *               - email
   *     responses:
   *       204:
   *         description: Request accepted
   */
  router.post('/auth/request-reset', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /auth/request-reset', getContext());
    const { email } = req.body;
    const useCase = new RequestPasswordResetUseCase(authService);
    await useCase.execute(email);
    logger.debug('Password reset requested', getContext());
    res.status(204).end();
  });

  /**
   * @openapi
  * /auth/reset:
  *   post:
  *     summary: Reset a user password.
   *     tags:
   *       - User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *             required:
   *               - token
   *               - password
   *     responses:
   *       204:
   *         description: Password reset
   */
  router.post('/auth/reset', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /auth/reset', getContext());
    const { token, password } = req.body;
    const useCase = new ResetPasswordUseCase(authService);
    await useCase.execute(token, password);
    logger.debug('Password reset performed', getContext());
    res.status(204).end();
  });

  router.use(authMiddleware);

  /**
   * @openapi
  * /users/me:
  *   get:
  *     summary: Returns the current user profile.
   *     tags:
   *       - User
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
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

  /**
   * @openapi
  * /users/{id}:
  *   put:
  *     summary: Update a user profile.
   *     tags:
   *       - User
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       200:
   *         description: Updated user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
  router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /users/:id', getContext());
    const user = parseUser({ ...req.body, id: req.params.id });
    const useCase = new UpdateUserProfileUseCase(userRepository);
    const updated = await useCase.execute(user);
    logger.debug('User profile updated', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /users/{id}/status:
  *   put:
  *     summary: Change user status.
   *     tags:
   *       - User
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [active, suspended, archived]
   *             required:
   *               - status
   *     responses:
   *       200:
   *         description: Updated user status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
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

  /**
   * @openapi
  * /users/{id}:
  *   delete:
  *     summary: Remove a user.
   *     tags:
   *       - User
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       204:
   *         description: User removed
   */
  router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /users/:id', getContext());
    const useCase = new RemoveUserUseCase(userRepository);
    await useCase.execute(req.params.id);
    logger.debug('User removed', getContext());
    res.status(204).end();
  });

  return router;
}
