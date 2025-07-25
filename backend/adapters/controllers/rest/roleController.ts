/* istanbul ignore file */
import express, {Request, Response, Router} from 'express';
import {RoleRepositoryPort} from '../../../domain/ports/RoleRepositoryPort';
import {UserRepositoryPort} from '../../../domain/ports/UserRepositoryPort';
import {LoggerPort} from '../../../domain/ports/LoggerPort';
import {getContext} from '../../../infrastructure/loggerContext';
import {Role} from '../../../domain/entities/Role';
import {Permission} from '../../../domain/entities/Permission';
import {CreateRoleUseCase} from '../../../usecases/role/CreateRoleUseCase';
import {UpdateRoleUseCase} from '../../../usecases/role/UpdateRoleUseCase';
import {RemoveRoleUseCase} from '../../../usecases/role/RemoveRoleUseCase';
import {GetRolesUseCase} from '../../../usecases/role/GetRolesUseCase';
import {GetRoleUseCase} from '../../../usecases/role/GetRoleUseCase';

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
 *       description: Individual capability that can be assigned to a role.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the permission.
 *         permissionKey:
 *           type: string
 *           description: Machine readable key used in permission checks.
 *         description:
 *           type: string
 *           description: Human readable explanation of the permission.
 *       required:
 *         - id
 *         - permissionKey
 *         - description
 *     Role:
 *       description: Set of permissions granted to users assigned this role.
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
 *           description: Permissions attached to the role.
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
     *   get:
     *     summary: Get all roles
     *     description: Returns a paginated list of roles.
     *     tags:
     *       - Role
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
     *         description: Number of roles per page.
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term on the role label.
     *     responses:
     *       200:
     *         description: Array of role objects.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Role'
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 total:
     *                   type: integer
     *       204:
     *         description: No content.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.get('/roles', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /roles', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const useCase = new GetRolesUseCase(roleRepository);
    const result = await useCase.execute({
      page,
      limit,
      filters: {search: req.query.search as string | undefined},
    });
    logger.debug('Roles retrieved', getContext());
    if (result.items.length === 0) {
      res.status(204).end();
      return;
    }
    res.json(result);
  });

  /**
     * @openapi
     * /roles/{id}:
     *   get:
     *     summary: Get role by ID
     *     description: Returns detailed information about a specific role.
     *     tags:
     *       - Role
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *         description: Unique identifier of the role.
     *     responses:
     *       200:
     *         description: Role details.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Role'
     *       404:
     *         description: Role not found.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.get('/roles/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /roles/:id', getContext());
    const useCase = new GetRoleUseCase(roleRepository);
    const role = await useCase.execute(req.params.id);
    if (!role) {
      logger.warn('Role not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Role retrieved', getContext());
    res.json(role);
  });

  /**
     * @openapi
     * /roles:
     *   post:
     *     summary: Create a role.
     *     description: |
     *       Registers a new role grouping a set of permissions. Requires
     *       authentication and administrative rights.
     *     tags:
     *       - Role
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       description: Role information to store.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Role'
     *     responses:
     *       201:
     *         description: Newly created role
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Role'
     *       401:
     *         description: Invalid or expired authentication token.
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
     *     description: Modify the label or permissions of an existing role.
     *     tags:
     *       - Role
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the role to update.
     *     requestBody:
     *       description: Updated role data.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Role'
     *     responses:
     *       200:
     *         description: Role after update
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Role'
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.put('/roles/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /roles/:id', getContext());
    const role = parseRole({...req.body, id: req.params.id});
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
     *     description: |
     *       Deletes a role. The operation fails if users are still associated with
     *       it. Requires administrative privileges.
     *     tags:
     *       - Role
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Identifier of the role to delete.
     *     responses:
     *       204:
     *         description: Role successfully deleted
     *       400:
     *         description: Deletion failed because the role is still in use
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.delete('/roles/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /roles/:id', getContext());
    const useCase = new RemoveRoleUseCase(roleRepository, userRepository);
    try {
      await useCase.execute(req.params.id);
      logger.debug('Role deleted', getContext());
      res.status(204).end();
    } catch (err) {
      logger.warn('Role deletion failed', {...getContext(), error: err});
      res.status(400).json({error: (err as Error).message});
    }
  });

  return router;
}
