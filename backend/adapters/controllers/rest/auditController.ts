/* istanbul ignore file */
import express, { Request, Response, Router } from 'express';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { GetAuditLogsUseCase } from '../../../usecases/audit/GetAuditLogsUseCase';
import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { GetAuditConfigUseCase } from '../../../usecases/audit/GetAuditConfigUseCase';
import { UpdateAuditConfigUseCase } from '../../../usecases/audit/UpdateAuditConfigUseCase';
import { User } from '../../../domain/entities/User';
import { TokenExpiredException } from '../../../domain/errors/TokenExpiredException';

interface AuthedRequest extends Request { user: User }

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     AuditEvent:
 *       description: Record of a significant action performed within the application.
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Time when the action occurred.
 *         actorId:
 *           type: string
 *           nullable: true
 *           description: Identifier of the actor responsible for the action.
 *         actorType:
 *           type: string
 *           enum: [user, system]
 *           description: Nature of the actor who triggered the event.
 *         action:
 *           type: string
 *           description: Description of the performed action.
 *         targetType:
 *           type: string
 *           nullable: true
 *           description: Type of the affected entity when applicable.
 *         targetId:
 *           type: string
 *           nullable: true
 *           description: Identifier of the affected entity when applicable.
 *         details:
 *           type: object
 *           nullable: true
 *           description: Additional event information.
 *         ipAddress:
 *           type: string
 *           nullable: true
 *           description: IP address from which the action originated.
 *         userAgent:
 *           type: string
 *           nullable: true
 *           description: User agent associated with the request.
 *     AuditConfig:
 *       description: Settings controlling which audit events are recorded.
 *       type: object
 *       properties:
 *         levels:
 *           type: array
 *           items:
 *             type: string
 *           description: Enabled audit levels.
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Event categories to log.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Time of last update.
 *         updatedBy:
 *           type: string
 *           nullable: true
 *           description: Identifier of the user who last modified the config.
 * tags:
 *   - name: Audit
 *     description: Access audit logs
 */
export function createAuditRouter(
  auth: AuthServicePort,
  users: UserRepositoryPort,
  audit: AuditPort,
  logger: LoggerPort,
  configService: AuditConfigService,
  getConfigUseCase: GetAuditConfigUseCase,
  updateConfigUseCase: UpdateAuditConfigUseCase,
): Router {
  const router = express.Router();

  const authMiddleware: express.RequestHandler = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).end();
      return;
    }
    const token = header.slice(7);
    try {
      const claims = await auth.verifyToken(token);
      const user = await users.findById(claims.id);
      if (!user) {
        res.status(401).end();
        return;
      }
      (req as AuthedRequest).user = user;
      next();
    } catch (err) {
      if (err instanceof TokenExpiredException) {
        res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        return;
      }
      res.status(401).end();
    }
  };

  router.use(authMiddleware);

  /**
   * @openapi
   * /audit:
   *   get:
   *     summary: List audit events
   *     description: Returns paginated audit log entries. Requires the `view_audit_logs` permission.
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number starting at 1.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Number of items per page.
   *       - in: query
   *         name: actorId
   *         schema:
   *           type: string
   *         description: Filter by actor identifier.
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *         description: Filter by action name.
   *       - in: query
   *         name: targetType
   *         schema:
   *           type: string
   *         description: Filter by target entity type.
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Include events from this date.
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Include events up to this date.
  *     responses:
  *       200:
  *         description: Paginated audit logs.
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 items:
  *                   type: array
  *                   items:
  *                     $ref: '#/components/schemas/AuditEvent'
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
  *       401:
  *         description: Invalid or expired authentication token.
  *       403:
  *         description: User lacks required permission.
  */
  router.get('/audit', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /audit', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const checker = new PermissionChecker((req as AuthedRequest).user);
    const useCase = new GetAuditLogsUseCase(audit, checker, configService);
    const result = await useCase.execute({
      page,
      limit,
      actorId: req.query.actorId as string | undefined,
      action: req.query.action as string | undefined,
      targetType: req.query.targetType as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    });
    if (result.items.length === 0) {
      res.status(204).end();
      return;
    }
    res.json(result);
  });

  /**
   * @openapi
   * /audit/config:
   *   get:
   *     summary: Get audit configuration
   *     description: Returns the audit logging configuration. Requires the `read-audit-config` permission.
   *     tags:
   *       - Audit
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Audit configuration
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuditConfig'
   *             example:
   *               levels: [info, warn]
   *               categories: [auth, config]
   *               updatedAt: '2024-01-01T00:00:00.000Z'
   *               updatedBy: user1
   *       204:
   *         description: No content.
   *       403:
   *         description: User lacks required permission.
   */
  router.get('/audit/config', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /audit/config', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.READ_AUDIT_CONFIG);
    } catch {
      res.status(403).end();
      return;
    }
    const cfg = await getConfigUseCase.execute();
    if (!cfg) {
      res.status(204).end();
      return;
    }
    res.json({
      levels: cfg.levels,
      categories: cfg.categories,
      updatedAt: cfg.updatedAt,
      updatedBy: cfg.updatedBy,
    });
  });

  /**
   * @openapi
   * /audit/config:
   *   put:
   *     summary: Update audit configuration
   *     description: |
   *       Update the audit logging configuration. Requires the `write-audit-config` permission.
   *       Generates an audit event with action `auditConfig.updated`.
   *     tags:
   *       - Audit
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       description: New audit logging settings.
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               levels:
   *                 type: array
   *                 items:
   *                   type: string
   *               categories:
   *                 type: array
   *                 items:
   *                   type: string
   *               updatedBy:
   *                 type: string
   *             required:
   *               - levels
   *               - categories
   *               - updatedBy
   *           example:
   *             levels: [info]
   *             categories: [auth]
   *             updatedBy: user1
   *     responses:
   *       200:
   *         description: Updated configuration
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuditConfig'
   *             example:
   *               levels: [info]
   *               categories: [auth]
   *               updatedAt: '2024-01-01T00:00:00.000Z'
   *               updatedBy: user1
   *       400:
   *         description: Validation error
   *       403:
   *         description: User lacks required permission.
   */
  router.put('/audit/config', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /audit/config', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.WRITE_AUDIT_CONFIG);
    } catch {
      res.status(403).end();
      return;
    }
    try {
      const cfg = await updateConfigUseCase.execute(
        req.body.levels,
        req.body.categories,
        req.body.updatedBy,
      );
      res.json({
        levels: cfg.levels,
        categories: cfg.categories,
        updatedAt: cfg.updatedAt,
        updatedBy: cfg.updatedBy,
      });
    } catch (err) {
      logger.warn('Failed to update audit config', { ...getContext(), error: err });
      res.status(400).json({ message: (err as Error).message });
    }
  });

  return router;
}

