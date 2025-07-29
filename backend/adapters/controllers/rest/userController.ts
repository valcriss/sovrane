/* istanbul ignore file */
import express, {Request, Response, Router} from 'express';
import type {Express} from 'express';
import multer from 'multer';
import {AuthServicePort} from '../../../domain/ports/AuthServicePort';
import {UserRepositoryPort} from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import {AvatarServicePort} from '../../../domain/ports/AvatarServicePort';
import {TokenServicePort} from '../../../domain/ports/TokenServicePort';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import {GetCurrentUserProfileUseCase} from '../../../usecases/user/GetCurrentUserProfileUseCase';
import {RegisterUserUseCase} from '../../../usecases/user/RegisterUserUseCase';
import {AuthenticateUserUseCase} from '../../../usecases/user/AuthenticateUserUseCase';
import {AuthenticateWithProviderUseCase} from '../../../usecases/user/AuthenticateWithProviderUseCase';
import { RotateRefreshTokenUseCase } from '../../../usecases/user/RotateRefreshTokenUseCase';
import { RevokeRefreshTokensUseCase } from '../../../usecases/user/RevokeRefreshTokensUseCase';
import {RequestPasswordResetUseCase} from '../../../usecases/user/RequestPasswordResetUseCase';
import {ResetPasswordUseCase} from '../../../usecases/user/ResetPasswordUseCase';
import {UpdateUserProfileUseCase} from '../../../usecases/user/UpdateUserProfileUseCase';
import {ChangeUserStatusUseCase} from '../../../usecases/user/ChangeUserStatusUseCase';
import {RemoveUserUseCase} from '../../../usecases/user/RemoveUserUseCase';
import {GetUsersUseCase} from '../../../usecases/user/GetUsersUseCase';
import {GetUserUseCase} from '../../../usecases/user/GetUserUseCase';
import {LoggerPort} from '../../../domain/ports/LoggerPort';
import { GetConfigUseCase } from '../../../usecases/config/GetConfigUseCase';
import {getContext} from '../../../infrastructure/loggerContext';
import {User} from '../../../domain/entities/User';
import {Role} from '../../../domain/entities/Role';
import {Department} from '../../../domain/entities/Department';
import {Site} from '../../../domain/entities/Site';
import {Permission} from '../../../domain/entities/Permission';
import {PermissionChecker} from '../../../domain/services/PermissionChecker';
import { PasswordValidator } from '../../../domain/services/PasswordValidator';
import { AccountLockedError } from '../../../domain/errors/AccountLockedError';
import { TokenExpiredException } from '../../../domain/errors/TokenExpiredException';
import { RefreshTokenTooSoonException } from '../../../domain/errors/RefreshTokenTooSoonException';
import { InvalidRefreshTokenException } from '../../../domain/errors/InvalidRefreshTokenException';
import {requireBodyParams} from './requestValidator';

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Site:
 *       description: Physical location where users and departments operate.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the site.
 *         label:
 *           type: string
 *           description: Human readable site name.
 *       required:
 *         - id
 *         - label
 *     Department:
 *       description: Organizational unit grouping users within a site.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the department.
 *         label:
 *           type: string
 *           description: Department name.
 *         parentDepartmentId:
 *           type: string
 *           nullable: true
 *           description: Identifier of the parent department if applicable.
 *         managerUserId:
 *           type: string
 *           nullable: true
 *           description: Identifier of the user managing this department.
 *         site:
 *           $ref: '#/components/schemas/Site'
 *           description: Site where the department is located.
 *       required:
 *         - id
 *         - label
 *         - site
 *     Permission:
 *       description: Authorization item representing an allowed action.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the permission.
 *         permissionKey:
 *           type: string
 *           description: Machine readable key for the permission.
 *         description:
 *           type: string
 *           description: Human readable explanation of the permission.
 *       required:
 *         - id
 *         - permissionKey
 *         - description
 *     Role:
 *       description: Collection of permissions that can be assigned to users.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the role.
 *         label:
 *           type: string
 *           description: Human readable role name.
 *         permissions:
 *           type: array
 *           description: Permissions granted by the role.
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *       required:
 *         - id
 *         - label
 *     User:
 *       description: Application user with profile and access information.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the user.
 *         firstName:
 *           type: string
 *           description: Given name of the user.
 *         lastName:
 *           type: string
 *           description: Family name of the user.
 *         email:
 *           type: string
 *           description: Email address used for communication and login.
 *         roles:
 *           type: array
 *           description: Roles assigned to the user.
 *           items:
 *             $ref: '#/components/schemas/Role'
 *         status:
 *           type: string
 *           enum: [active, suspended, archived]
 *           description: Current account status.
 *         department:
 *           $ref: '#/components/schemas/Department'
 *           description: Department the user belongs to.
 *         site:
 *           $ref: '#/components/schemas/Site'
 *           description: Site where the user is located.
 *         picture:
 *           type: string
 *           description: Optional URL of the profile picture.
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the user's last successful login.
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the user's last activity (login or token refresh).
 *         failedLoginAttempts:
 *           type: integer
 *           description: Number of consecutive failed login attempts.
 *         lastFailedLoginAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp of the last failed login attempt.
 *         lockedUntil:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Account lock expiration timestamp when locked.
 *         permissions:
 *           type: array
 *           description: Permissions granted directly to the user.
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *         - email
 *         - department
 *         - site
 *     ErrorResponse:
 *       description: Error information when a request fails.
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Human readable error message.
 *         code:
 *           type: string
 *           description: Machine readable error code.
 *       required:
 *         - error
 *         - code
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
  audit: AuditPort,
  avatarService: AvatarServicePort,
  tokenService: TokenServicePort,
  refreshTokenRepository: RefreshTokenPort,
  logger: LoggerPort,
  getConfigUseCase: GetConfigUseCase,
  passwordValidator: PasswordValidator,
): Router {
  const router = express.Router();
  const upload = multer();

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

    function serializeUser(u: User): Record<string, unknown> {
      return {
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
        lastActivity: u.lastActivity ? u.lastActivity.toISOString() : null,
        lastFailedLoginAt: u.lastFailedLoginAt ? u.lastFailedLoginAt.toISOString() : null,
        lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
        createdBy: null,
        updatedBy: null,
      };
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
      } catch (err) {
        logger.warn('REST auth failed', { ...getContext(), error: err });
        if (err instanceof TokenExpiredException) {
          res
            .status(401)
            .json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
          return;
        }
        res.status(401).end();
      }
    };

    /**
     * @openapi
     * /users:
     *   post:
     *     summary: Register a new user.
     *     description: |
     *       Creates a user account for a new participant. This endpoint is open
     *       to unauthenticated clients and is typically used during onboarding.
     *       The returned `refreshToken` allows requesting a new access token.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Data describing the user to create including the account password.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             allOf:
     *               - $ref: '#/components/schemas/User'
     *               - type: object
     *                 properties:
     *                   password:
     *                     type: string
     *                     description: Must comply with configured password policy
     *                 required:
     *                   - password
     *     responses:
     *       201:
     *         description: Newly created user profile with authentication tokens.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *                 token:
     *                   type: string
     *                 refreshToken:
     *                   type: string
     *       400:
     *         description: Validation error.
     */
    router.post('/users', async (req: Request, res: Response): Promise<void> => {
      logger.debug('POST /users', getContext());
      const useCase = new RegisterUserUseCase(
        userRepository,
        tokenService,
        passwordValidator,
      );
      const result = await useCase.execute(
        parseUser(req.body),
        req.body.password,
        req.ip,
        req.get('user-agent') || undefined,
      );
      logger.debug('User registered', getContext());
      res.status(201).json(result);
    });

    /**
     * @openapi
     * /auth/login:
     *   post:
     *     summary: Authenticate a user with email and password.
     *     description: |
     *       Validates the provided credentials and returns the corresponding user
     *       profile if the login succeeds. The `refreshToken` can be used to
     *       obtain a new access token when the short lived one expires.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Email and password used to authenticate.
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
     *         description: User successfully authenticated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *                 token:
     *                   type: string
     *                 refreshToken:
     *                   type: string
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid credentials
     *       403:
     *         description: User account is suspended or archived
     */
    router.post(
      '/auth/login',
      requireBodyParams({
        email: {validator: 'email'},
        password: {validator: 'string', minLength: 8, maxLength: 49},
      }),
      async (req: Request, res: Response): Promise<void> => {
        logger.debug('POST /auth/login', getContext());
        const {email, password} = req.body;
        const useCase = new AuthenticateUserUseCase(
          authService,
          tokenService,
          userRepository,
          audit,
          logger,
          getConfigUseCase,
        );
        try {
          const result = await useCase.execute(
            email,
            password,
            req.ip,
            req.get('user-agent') || undefined,
          );
          logger.debug('User authenticated', getContext());
          res.json(result);
        } catch (err) {
          logger.warn('Authentication failed', { ...getContext(), error: err });
          if (err instanceof AccountLockedError) {
            res
              .status(423)
              .json({
                error: err.message,
                code: 'account_locked',
                lockedUntil: err.lockedUntil.toISOString(),
              });
            return;
          }
          const message = (err as Error).message;
          const status =
            message === 'User account is suspended or archived' ? 403 : 401;
          res.status(status).json({ error: message });
        }
      },
    );

    /**
     * @openapi
     * /auth/refresh:
     *   post:
     *     summary: Refresh an access token.
     *     description: |
     *       Exchanges a valid refresh token for a new access token.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Refresh token previously issued by the API.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               refreshToken:
     *                 type: string
     *             required:
     *               - refreshToken
     *     responses:
     *       200:
     *         description: New authentication tokens.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 token:
     *                   type: string
     *                 refreshToken:
     *                   type: string
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired refresh token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       429:
     *         description: Refresh token rotation attempted too soon
     */
    router.post(
      '/auth/refresh',
      requireBodyParams({ refreshToken: { validator: 'string' } }),
      async (req: Request, res: Response): Promise<void> => {
        logger.debug('POST /auth/refresh', getContext());
        const { refreshToken } = req.body;
        const useCase = new RotateRefreshTokenUseCase(
          refreshTokenRepository,
          tokenService,
          userRepository,
          audit,
        );
        try {
          const result = await useCase.execute(
            refreshToken,
            req.ip,
            req.headers['user-agent'],
          );
          logger.debug('Tokens rotated', getContext());
          res.json(result);
        } catch (err) {
          logger.warn('Refresh token failed', { ...getContext(), error: err });
          if (err instanceof RefreshTokenTooSoonException) {
            res.status(429).json({ error: err.message });
          } else if (err instanceof InvalidRefreshTokenException) {
            res.status(401).json({ error: err.message, code: err.code });
          } else {
            res.status(401).json({ error: (err as Error).message });
          }
        }
      },
    );

    /**
     * @openapi
     * /auth/logout:
     *   post:
     *     summary: Revoke refresh token.
     *     description: |
     *       Invalidates the provided refresh token, logging the user out.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Refresh token to revoke.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               refreshToken:
     *                 type: string
     *             required:
     *               - refreshToken
     *     responses:
     *       200:
     *         description: Logged out successfully
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired refresh token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
 */
    router.post(
      '/auth/logout',
      requireBodyParams({ refreshToken: { validator: 'string' } }),
      async (req: Request, res: Response): Promise<void> => {
        logger.debug('POST /auth/logout', getContext());
        const { refreshToken } = req.body;
        const useCase = new RevokeRefreshTokensUseCase(refreshTokenRepository);
        try {
          await useCase.execute(refreshToken);
          logger.debug('Token revoked', getContext());
          res.json({ message: 'Logged out successfully' });
        } catch (err) {
          logger.warn('Token revoke failed', { ...getContext(), error: err });
          if (err instanceof InvalidRefreshTokenException) {
            res.status(401).json({ error: err.message, code: err.code });
          } else {
            res.status(401).json({ error: (err as Error).message });
          }
        }
      },
    );

    /**
     * @openapi
     * /auth/provider:
     *   post:
     *     summary: Authenticate a user with an external provider.
     *     description: |
     *       Exchanges a provider issued token (e.g. OAuth) for a local session and
     *       returns the associated user profile.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Provider name and issued token.
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
     *         description: User successfully authenticated with the provider
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid provider token
     *       403:
     *         description: User account is suspended or archived
     */
    router.post('/auth/provider', async (req: Request, res: Response): Promise<void> => {
      logger.debug('POST /auth/provider', getContext());
      const {provider, token} = req.body;
      const useCase = new AuthenticateWithProviderUseCase(authService, userRepository);
      try {
        const user = await useCase.execute(provider, token);
        logger.debug('Provider auth success', getContext());
        res.json(user);
      } catch (err) {
        logger.warn('Provider auth failed', {...getContext(), error: err});
        const message = (err as Error).message;
        const status =
                message === 'User account is suspended or archived' ? 403 : 401;
        res.status(status).json({error: message});
      }
    });

    /**
     * @openapi
     * /auth/request-reset:
     *   post:
     *     summary: Request a password reset email.
     *     description: Sends a password reset link to the provided email address.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Email address of the account requesting a reset.
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
     *         description: Reset request processed, no content returned
     *       400:
     *         description: Validation error
     */
    router.post('/auth/request-reset', async (req: Request, res: Response): Promise<void> => {
      logger.debug('POST /auth/request-reset', getContext());
      const {email} = req.body;
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
     *     description: |
     *       Completes the password reset process using a valid reset token and the
     *       new password provided.
     *     tags:
     *       - User
     *     requestBody:
     *       description: Reset token and the new password.
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
     *                 description: Must comply with configured password policy
     *             required:
     *               - token
     *               - password
     *     responses:
     *       204:
     *         description: Password successfully changed
     *       400:
     *         description: Validation error
     */
    router.post('/auth/reset', async (req: Request, res: Response): Promise<void> => {
      logger.debug('POST /auth/reset', getContext());
      const {token, password} = req.body;
      const user = await authService.verifyToken(token);
      const useCase = new ResetPasswordUseCase(
        authService,
        passwordValidator,
        refreshTokenRepository,
      );
      await useCase.execute(user.id, token, password);
      logger.debug('Password reset performed', getContext());
      res.status(204).end();
    });

    router.use(authMiddleware);

    /**
     * @openapi
     * /users:
     *   get:
     *     summary: Get all users
     *     description: Returns a paginated and filterable list of users.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number (starts at 1).
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *         description: Number of users per page.
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term to filter users by name or email.
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, suspended, archived]
     *         description: Filter users by status.
     *       - in: query
     *         name: departmentId
     *         schema:
     *           type: string
     *         description: Filter by department identifier.
     *       - in: query
     *         name: siteId
     *         schema:
     *           type: string
     *         description: Filter by site identifier.
     *       - in: query
     *         name: roleId
     *         schema:
     *           type: string
     *         description: Filter by role identifier.
     *     responses:
     *       200:
     *         description: Paginated user list
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 total:
     *                   type: integer
     *               example:
     *                 items: []
     *                 page: 1
     *                 limit: 20
     *                 total: 0
     *       204:
     *         description: No content.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
    router.get('/users', async (req: Request, res: Response): Promise<void> => {
      logger.debug('GET /users', getContext());
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const checker = new PermissionChecker((req as AuthedRequest).user);
      const useCase = new GetUsersUseCase(userRepository, checker);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: {
            search: req.query.search as string | undefined,
            status: req.query.status as
                      | 'active'
                      | 'suspended'
                      | 'archived'
                      | undefined,
            departmentId: req.query.departmentId as string | undefined,
            siteId: req.query.siteId as string | undefined,
            roleId: req.query.roleId as string | undefined,
          },
        });
        logger.debug('Users retrieved', getContext());
        if (result.items.length === 0) {
          res.status(204).end();
          return;
        }
        res.json(result);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          logger.warn('Permission denied listing users', {...getContext(), error: err});
          res.status(403).json({error: 'Forbidden'});
          return;
        }
        throw err;
      }
    });

    /**
     * @openapi
     * /users/{id}:
     *   get:
     *     summary: Get user by ID
     *     description: Returns detailed information about a specific user.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *         description: Unique identifier of the user.
     *     responses:
     *       200:
     *         description: User details.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
    router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
      logger.debug('GET /users/:id', getContext());
      const checker = new PermissionChecker((req as AuthedRequest).user);
      const useCase = new GetUserUseCase(userRepository, checker);
      try {
        const user = await useCase.execute(req.params.id);
        if (!user) {
          logger.warn('User not found', getContext());
          res.status(404).end();
          return;
        }
        logger.debug('User retrieved', getContext());
        res.json(user);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          logger.warn('Permission denied getting user', { ...getContext(), error: err });
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        throw err;
      }
    });

    /**
     * @openapi
     * /users/me:
     *   get:
     *     summary: Returns the current user profile.
     *     description: |
     *       Retrieves information about the authenticated user. A valid bearer
     *       token must be supplied in the `Authorization` header.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Profile of the authenticated user
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Validation error
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
    router.get('/users/me', async (req: Request, res: Response): Promise<void> => {
      logger.debug('GET /users/me', getContext());
      const checker = new PermissionChecker((req as AuthedRequest).user);
      const useCase = new GetCurrentUserProfileUseCase(userRepository, checker);
      try {
        const user = await useCase.execute((req as AuthedRequest).user.id);
        if (!user) {
          logger.warn('Current user not found', getContext());
          res.status(404).end();
          return;
        }
        logger.debug('Current user returned', getContext());
        res.json(user);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          logger.warn('Permission denied current profile', { ...getContext(), error: err });
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        throw err;
      }
    });

    /**
     * @openapi
     * /users/{id}:
     *   put:
     *     summary: Update a user profile.
     *     description: |
     *       Updates information about an existing user. Authentication is required
     *       and only authorized administrators should call this endpoint.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the user to update.
     *     requestBody:
     *       description: Updated user information.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/User'
     *     responses:
     *       200:
     *         description: The user profile after update
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Validation error
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
    router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
      logger.debug('PUT /users/:id', getContext());
      const user = parseUser({ ...req.body, id: req.params.id });
      const checker = new PermissionChecker((req as AuthedRequest).user);
      const useCase = new UpdateUserProfileUseCase(userRepository, checker, audit);
      try {
        const updated = await useCase.execute(user);
        logger.debug('User profile updated', getContext());
        res.json(serializeUser(updated));
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          logger.warn('Permission denied updating user', { ...getContext(), error: err });
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        throw err;
      }
    });

    /**
     * @openapi
     * /users/{id}/status:
     *   put:
     *     summary: Change user status.
     *     description: |
     *       Updates the account status (active, suspended or archived) of a user.
     *       Requires administrator privileges.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the user to update.
     *     requestBody:
     *       description: The new status value.
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
     *         description: User with the updated status
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Validation error
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
    router.put('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
      logger.debug('PUT /users/:id/status', getContext());
      const { status } = req.body;
      const checker = new PermissionChecker((req as AuthedRequest).user);
      const useCase = new ChangeUserStatusUseCase(userRepository, checker);
      try {
        const updated = await useCase.execute(req.params.id, status);
        if (!updated) {
          logger.warn('User not found for status change', getContext());
          res.status(404).end();
          return;
        }
        logger.debug('User status changed', getContext());
        res.json(serializeUser(updated));
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          logger.warn('Permission denied changing status', { ...getContext(), error: err });
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        throw err;
      }
    });

    /**
     * @openapi
     * /users/{id}/picture:
     *   post:
     *     summary: Upload user avatar
     *     description: |
     *       Uploads an avatar image for the specified user. Requires authentication.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the user.
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *             required:
     *               - file
     *     responses:
     *       204:
     *         description: Avatar updated
     *       400:
     *         description: Validation error
     *       401:
     *         description: Invalid or expired authentication token.
     */
    router.post('/users/:id/picture', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
      logger.debug('POST /users/:id/picture', getContext());
      await avatarService.setUserAvatar(req.params.id, (req.file as Express.Multer.File).buffer, req.file!.originalname);
      res.status(204).end();
    });

    /**
     * @openapi
     * /users/{id}/picture:
     *   delete:
     *     summary: Remove user avatar
     *     description: Deletes the avatar of the specified user if present.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the user.
     *     responses:
     *       204:
     *         description: Avatar removed
     *       400:
     *         description: Validation error
     *       401:
     *         description: Invalid or expired authentication token.
     */
    router.delete('/users/:id/picture', async (req: Request, res: Response): Promise<void> => {
      logger.debug('DELETE /users/:id/picture', getContext());
      await avatarService.removeUserAvatar(req.params.id);
      res.status(204).end();
    });

    /**
     * @openapi
     * /users/{id}:
     *   delete:
     *     summary: Remove a user.
     *     description: |
     *       Permanently deletes a user account. This operation cannot be undone
     *       and requires administrative privileges.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the user to delete.
     *     responses:
     *       204:
     *         description: User successfully removed
     *       400:
     *         description: Validation error
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
    router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
      logger.debug('DELETE /users/:id', getContext());
      const checker = new PermissionChecker((req as AuthedRequest).user);
      const useCase = new RemoveUserUseCase(
        userRepository,
        checker,
        refreshTokenRepository,
      );
      try {
        await useCase.execute(req.params.id);
        logger.debug('User removed', getContext());
        res.status(204).end();
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          logger.warn('Permission denied deleting user', { ...getContext(), error: err });
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        throw err;
      }
    });

    return router;
}
