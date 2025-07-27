/* istanbul ignore file */
import express, { Request, Response, Router } from 'express';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { GetAuditLogsUseCase } from '../../../usecases/audit/GetAuditLogsUseCase';
import { User } from '../../../domain/entities/User';

interface AuthedRequest extends Request { user: User }

/**
 * @openapi
 * tags:
 *   - name: Audit
 *     description: Access audit logs
 */
export function createAuditRouter(
  auth: AuthServicePort,
  users: UserRepositoryPort,
  audit: AuditPort,
  logger: LoggerPort,
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
    } catch {
      res.status(401).end();
    }
  };

  router.use(authMiddleware);

  /**
   * @openapi
   * /audit:
   *   get:
   *     summary: List audit events
   *     description: Returns paginated audit log entries.
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
   *         description: Paginated audit logs
   *       204:
   *         description: No content
   *       401:
   *         description: Unauthorized
   */
  router.get('/audit', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /audit', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const checker = new PermissionChecker((req as AuthedRequest).user);
    const useCase = new GetAuditLogsUseCase(audit, checker);
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

  return router;
}

