import express, { Request, Response, Router } from 'express';
import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { User } from '../../../domain/entities/User';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { AuditEventType } from '../../../domain/entities/AuditEventType';
import { getContext } from '../../../infrastructure/loggerContext';

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
 *   - name: Audit Config
 *     description: Manage audit logging settings
 */
export function createAuditConfigRouter(
  service: AuditConfigService,
  audit: AuditPort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  /**
   * @openapi
   * /audit/config:
   *   get:
   *     summary: Get audit configuration
   *     description: Returns the audit logging configuration. Requires the `read-audit-config` permission.
   *     tags:
   *       - Audit Config
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
    const cfg = await service.get();
    await audit.log(new AuditEvent(new Date(), (req as AuthedRequest).user.id, 'user', AuditEventType.AUDIT_CONFIG_UPDATED, 'audit-config'));
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
   *       - Audit Config
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
      const cfg = await service.update(req.body.levels, req.body.categories, req.body.updatedBy);
      await audit.log(new AuditEvent(new Date(), req.body.updatedBy, 'user', AuditEventType.AUDIT_CONFIG_UPDATED, 'audit-config'));
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
