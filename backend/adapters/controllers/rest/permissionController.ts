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
