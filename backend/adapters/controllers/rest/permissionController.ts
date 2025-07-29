/* istanbul ignore file */
import express, {Request, Response, Router} from 'express';
import {PermissionRepositoryPort} from '../../../domain/ports/PermissionRepositoryPort';
import {LoggerPort} from '../../../domain/ports/LoggerPort';
import {getContext} from '../../../infrastructure/loggerContext';
import {Permission} from '../../../domain/entities/Permission';
import {PermissionChecker} from '../../../domain/services/PermissionChecker';
import {PermissionKeys} from '../../../domain/entities/PermissionKeys';
import {User} from '../../../domain/entities/User';
import {CreatePermissionUseCase} from '../../../usecases/permission/CreatePermissionUseCase';
import {UpdatePermissionUseCase} from '../../../usecases/permission/UpdatePermissionUseCase';
import {RemovePermissionUseCase} from '../../../usecases/permission/RemovePermissionUseCase';
import {GetPermissionsUseCase} from '../../../usecases/permission/GetPermissionsUseCase';
import {GetPermissionUseCase} from '../../../usecases/permission/GetPermissionUseCase';

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Permission:
 *       description: Individual capability that can be granted to roles or users.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the permission.
 *         permissionKey:
 *           type: string
 *           description: Machine readable key used in access checks.
 *         description:
 *           type: string
 *           description: Human readable explanation of the permission.
 *       required:
 *         - id
 *         - permissionKey
 *         - description
 */

interface PermissionPayload {
    id: string;
    permissionKey: string;
    description: string;
}

interface AuthedRequest extends Request {
  user: User;
}

/* istanbul ignore next */
function parsePermission(body: PermissionPayload): Permission {
  return new Permission(body.id, body.permissionKey, body.description);
}

export function createPermissionRouter(
  repository: PermissionRepositoryPort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  /**
     * @openapi
     * /permissions:
     *   get:
     *     summary: Get all permissions
     *     description: Returns the list of all permissions.
     *     tags:
     *       - Permission
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
     *         description: Number of permissions per page.
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term on key or description.
     *     responses:
     *       200:
     *         description: Paginated permission list.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Permission'
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 total:
     *                   type: integer
     *       204:
     *         description: No content.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.get('/permissions', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /permissions', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.READ_PERMISSIONS);
    } catch (err) {
      logger.warn('Permission denied listing permissions', {...getContext(), error: err});
      res.status(403).json({error: 'Forbidden'});
      return;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const useCase = new GetPermissionsUseCase(repository);
    const result = await useCase.execute({
      page,
      limit,
      filters: {search: req.query.search as string | undefined},
    });
    logger.debug('Permissions retrieved', getContext());
    if (result.items.length === 0) {
      res.status(204).end();
      return;
    }
    res.json(result);
  });

  /**
     * @openapi
     * /permissions/{id}:
     *   get:
     *     summary: Get permission by ID
     *     description: Returns detailed information about a specific permission.
     *     tags:
     *       - Permission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *         description: Unique identifier of the permission.
     *     responses:
     *       200:
     *         description: Permission details.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Permission'
     *       404:
     *         description: Permission not found.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.get('/permissions/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /permissions/:id', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.READ_PERMISSIONS);
    } catch (err) {
      logger.warn('Permission denied reading permission', {...getContext(), error: err});
      res.status(403).json({error: 'Forbidden'});
      return;
    }
    const useCase = new GetPermissionUseCase(repository);
    const permission = await useCase.execute(req.params.id);
    if (!permission) {
      logger.warn('Permission not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Permission retrieved', getContext());
    res.json(permission);
  });

  /**
     * @openapi
     * /permissions:
     *   post:
     *     summary: Create a permission.
     *     description: |
     *       Registers a new permission in the system. Only authenticated
     *       administrators should use this endpoint.
     *     tags:
     *       - Permission
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       description: Permission details to create.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Permission'
     *     responses:
     *       201:
     *         description: Newly created permission
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Permission'
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.post('/permissions', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /permissions', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.CREATE_PERMISSION);
    } catch (err) {
      logger.warn('Permission denied creating permission', {...getContext(), error: err});
      res.status(403).json({error: 'Forbidden'});
      return;
    }
    const useCase = new CreatePermissionUseCase(repository);
    const permission = await useCase.execute(parsePermission(req.body));
    logger.debug('Permission created', getContext());
    res.status(201).json(permission);
  });

  /**
     * @openapi
     * /permissions/{id}:
     *   put:
     *     summary: Update a permission.
     *     description: Modify the key or description of an existing permission.
     *     tags:
     *       - Permission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the permission to update.
     *     requestBody:
     *       description: Updated permission information.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Permission'
     *     responses:
     *       200:
     *         description: Permission after update
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Permission'
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.put('/permissions/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /permissions/:id', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.UPDATE_PERMISSION);
    } catch (err) {
      logger.warn('Permission denied updating permission', {...getContext(), error: err});
      res.status(403).json({error: 'Forbidden'});
      return;
    }
    const permission = parsePermission({...req.body, id: req.params.id});
    const useCase = new UpdatePermissionUseCase(repository);
    const updated = await useCase.execute(permission);
    logger.debug('Permission updated', getContext());
    res.json(updated);
  });

  /**
     * @openapi
     * /permissions/{id}:
     *   delete:
     *     summary: Remove a permission.
     *     description: Deletes an existing permission. It should no longer be
     *       referenced by any role before calling this endpoint.
     *     tags:
     *       - Permission
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the permission to delete.
     *     responses:
     *       204:
     *         description: Permission successfully removed
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.delete('/permissions/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /permissions/:id', getContext());
    const checker = new PermissionChecker((req as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.DELETE_PERMISSION);
    } catch (err) {
      logger.warn('Permission denied removing permission', {...getContext(), error: err});
      res.status(403).json({error: 'Forbidden'});
      return;
    }
    const useCase = new RemovePermissionUseCase(repository);
    await useCase.execute(req.params.id);
    logger.debug('Permission removed', getContext());
    res.status(204).end();
  });

  return router;
}
