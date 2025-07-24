import express, { Request, Response, Router } from 'express';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { CreateRoleUseCase } from '../../../usecases/role/CreateRoleUseCase';
import { UpdateRoleUseCase } from '../../../usecases/role/UpdateRoleUseCase';
import { RemoveRoleUseCase } from '../../../usecases/role/RemoveRoleUseCase';

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
 */

interface RolePayload {
  id: string;
  label: string;
  permissions?: Array<{ id: string; permissionKey: string; description: string }>;
}

/* istanbul ignore next */
function parseRole(body: RolePayload): Role {
  return new Role(
    body.id,
    body.label,
    (body.permissions ?? []).map(
      (p) => new Permission(p.id, p.permissionKey, p.description),
    ),
  );
}

export function createRoleRouter(
  roleRepository: RoleRepositoryPort,
  userRepository: UserRepositoryPort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  /**
   * @openapi
  * /roles:
  *   post:
  *     summary: Create a role.
   *     tags:
   *       - Role
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Role'
   *     responses:
   *       201:
   *         description: Role created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Role'
   */
  router.post('/roles', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /roles', getContext());
    const useCase = new CreateRoleUseCase(roleRepository);
    const role = await useCase.execute(parseRole(req.body));
    logger.debug('Role created', getContext());
    res.status(201).json(role);
  });

  /**
   * @openapi
  * /roles/{id}:
  *   put:
  *     summary: Update a role.
   *     tags:
   *       - Role
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Role'
   *     responses:
   *       200:
   *         description: Updated role
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Role'
   */
  router.put('/roles/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /roles/:id', getContext());
    const role = parseRole({ ...req.body, id: req.params.id });
    const useCase = new UpdateRoleUseCase(roleRepository);
    const updated = await useCase.execute(role);
    logger.debug('Role updated', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /roles/{id}:
  *   delete:
  *     summary: Remove a role.
   *     tags:
   *       - Role
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       204:
   *         description: Role deleted
   *       400:
   *         description: Operation failed
   */
  router.delete('/roles/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /roles/:id', getContext());
    const useCase = new RemoveRoleUseCase(roleRepository, userRepository);
    try {
      await useCase.execute(req.params.id);
      logger.debug('Role deleted', getContext());
      res.status(204).end();
    } catch (err) {
      logger.warn('Role deletion failed', { ...getContext(), error: err });
      res.status(400).json({ error: (err as Error).message });
    }
  });

  return router;
}
