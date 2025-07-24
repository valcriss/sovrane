import express, { Request, Response, Router } from 'express';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { Permission } from '../../../domain/entities/Permission';
import { CreatePermissionUseCase } from '../../../usecases/permission/CreatePermissionUseCase';
import { UpdatePermissionUseCase } from '../../../usecases/permission/UpdatePermissionUseCase';
import { RemovePermissionUseCase } from '../../../usecases/permission/RemovePermissionUseCase';

/**
 * @openapi
 * components:
 *   schemas:
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
 */

interface PermissionPayload {
  id: string;
  permissionKey: string;
  description: string;
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
  *   post:
  *     summary: Create a permission.
   *     tags:
   *       - Permission
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Permission'
   *     responses:
   *       201:
   *         description: Permission created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Permission'
   */
  router.post('/permissions', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /permissions', getContext());
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
   *     tags:
   *       - Permission
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Permission'
   *     responses:
   *       200:
   *         description: Updated permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Permission'
   */
  router.put('/permissions/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /permissions/:id', getContext());
    const permission = parsePermission({ ...req.body, id: req.params.id });
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
   *     tags:
   *       - Permission
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       204:
   *         description: Permission removed
   */
  router.delete('/permissions/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /permissions/:id', getContext());
    const useCase = new RemovePermissionUseCase(repository);
    await useCase.execute(req.params.id);
    logger.debug('Permission removed', getContext());
    res.status(204).end();
  });

  return router;
}
