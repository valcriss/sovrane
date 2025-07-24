import express, { Request, Response, Router } from 'express';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { CreateDepartmentUseCase } from '../../../usecases/department/CreateDepartmentUseCase';
import { UpdateDepartmentUseCase } from '../../../usecases/department/UpdateDepartmentUseCase';
import { RemoveDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentUseCase';
import { SetDepartmentManagerUseCase } from '../../../usecases/department/SetDepartmentManagerUseCase';
import { RemoveDepartmentManagerUseCase } from '../../../usecases/department/RemoveDepartmentManagerUseCase';
import { SetDepartmentParentDepartmentUseCase } from '../../../usecases/department/SetDepartmentParentDepartmentUseCase';
import { RemoveDepartmentParentDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentParentDepartmentUseCase';
import { SetDepartmentPermissionUseCase } from '../../../usecases/department/SetDepartmentPermissionUseCase';
import { RemoveDepartmentPermissionUseCase } from '../../../usecases/department/RemoveDepartmentPermissionUseCase';
import { AddChildDepartmentUseCase } from '../../../usecases/department/AddChildDepartmentUseCase';
import { RemoveChildDepartmentUseCase } from '../../../usecases/department/RemoveChildDepartmentUseCase';
import { AddDepartmentUserUseCase } from '../../../usecases/department/AddDepartmentUserUseCase';
import { RemoveDepartmentUserUseCase } from '../../../usecases/department/RemoveDepartmentUserUseCase';

/**
 * @openapi
 * components:
 *   schemas:
 *     Site:
 *       description: Location that hosts departments within the organization.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the site.
 *         label:
 *           type: string
 *           description: Human readable name of the site.
 *       required:
 *         - id
 *         - label
 *     Permission:
 *       description: Capability that can be granted to a department.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the permission.
 *         permissionKey:
 *           type: string
 *           description: Machine readable key used to check access.
 *         description:
 *           type: string
 *           description: Human readable explanation of the permission.
 *       required:
 *         - id
 *         - permissionKey
 *         - description
 *     Department:
 *       description: Organizational division containing users and permissions.
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
 *           description: Identifier of the parent department when nested.
 *         managerUserId:
 *           type: string
 *           nullable: true
 *           description: User responsible for the department.
 *         site:
 *           $ref: '#/components/schemas/Site'
 *           description: Site where the department is located.
 *         permissions:
 *           type: array
 *           description: Permissions granted to the department.
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *       required:
 *         - id
 *         - label
 *         - site
 */

interface DepartmentPayload {
  id: string;
  label: string;
  parentDepartmentId?: string | null;
  managerUserId?: string | null;
  site: { id: string; label: string };
  permissions?: Array<{ id: string; permissionKey: string; description: string }>;
}

/* istanbul ignore next */
function parseDepartment(body: DepartmentPayload): Department {
  return new Department(
    body.id,
    body.label,
    body.parentDepartmentId ?? null,
    body.managerUserId ?? null,
    new Site(body.site.id, body.site.label),
    (body.permissions ?? []).map(
      (p) => new Permission(p.id, p.permissionKey, p.description),
    ),
  );
}

export function createDepartmentRouter(
  departmentRepository: DepartmentRepositoryPort,
  userRepository: UserRepositoryPort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  /**
   * @openapi
   * /departments:
 *   post:
 *     summary: Create a department.
 *     description: |
 *       Creates a new department within a site. Authentication with
 *       administrator privileges is required.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Department information to create.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Department'
   *     responses:
 *       201:
 *         description: Newly created department
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.post('/departments', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /departments', getContext());
    const useCase = new CreateDepartmentUseCase(departmentRepository);
    const department = await useCase.execute(parseDepartment(req.body));
    logger.debug('Department created', getContext());
    res.status(201).json(department);
  });

  /**
   * @openapi
  * /departments/{id}:
 *   put:
 *     summary: Update a department.
 *     description: Modify a department's label, parent, manager or permissions.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department to update.
 *     requestBody:
 *       description: Updated department information.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Department'
   *     responses:
 *       200:
 *         description: Department after update
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.put('/departments/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /departments/:id', getContext());
    const department = parseDepartment({ ...req.body, id: req.params.id });
    const useCase = new UpdateDepartmentUseCase(departmentRepository);
    const updated = await useCase.execute(department);
    logger.debug('Department updated', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/children/{childId}:
 *   post:
 *     summary: Add a child department.
 *     description: |
 *       Attaches an existing department as a child of another department.
 *       Requires authentication with administrative rights.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the parent department.
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the child department to attach.
 *     responses:
 *       200:
 *         description: Department with new child attached
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.post('/departments/:id/children/:childId', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /departments/:id/children/:childId', getContext());
    const useCase = new AddChildDepartmentUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.id, req.params.childId);
    if (!updated) {
      logger.warn('Child department not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Child department added', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/children/{childId}:
 *   delete:
 *     summary: Remove a child department.
 *     description: |
 *       Detaches a child department from its parent. Authentication and
 *       administrative privileges are required.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the parent department.
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the child department to detach.
 *     responses:
 *       200:
 *         description: Department without the removed child
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.delete('/departments/:id/children/:childId', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /departments/:id/children/:childId', getContext());
    const useCase = new RemoveChildDepartmentUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.childId);
    if (!updated) {
      logger.warn('Child department not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Child department removed', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/manager:
 *   put:
 *     summary: Set department manager.
 *     description: |
 *       Assigns a user as the manager of the department. Requires
 *       administrator privileges.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department.
 *     requestBody:
 *       description: User identifier to set as manager.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *             required:
   *               - userId
   *     responses:
 *       200:
 *         description: Department with manager assigned
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.put('/departments/:id/manager', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /departments/:id/manager', getContext());
    const useCase = new SetDepartmentManagerUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.id, req.body.userId);
    if (!updated) {
      logger.warn('Department not found for manager set', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department manager set', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/manager:
 *   delete:
 *     summary: Remove department manager.
 *     description: |
 *       Clears the manager of the department. The caller must be authenticated
 *       as an administrator.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department.
 *     responses:
 *       200:
 *         description: Department without manager
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.delete('/departments/:id/manager', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /departments/:id/manager', getContext());
    const useCase = new RemoveDepartmentManagerUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.id);
    if (!updated) {
      logger.warn('Department not found for manager removal', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department manager removed', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/parent:
 *   put:
 *     summary: Set parent department.
 *     description: |
 *       Defines the parent department for hierarchical organization. Requires
 *       administrator privileges.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department to update.
 *     requestBody:
 *       description: Identifier of the new parent department.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               parentId:
   *                 type: string
   *             required:
   *               - parentId
   *     responses:
 *       200:
 *         description: Department with updated parent
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.put('/departments/:id/parent', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /departments/:id/parent', getContext());
    const useCase = new SetDepartmentParentDepartmentUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.id, req.body.parentId);
    if (!updated) {
      logger.warn('Department not found for parent set', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department parent set', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/parent:
 *   delete:
 *     summary: Remove parent department.
 *     description: |
 *       Detaches the department from its current parent. Administrator
 *       authentication is required.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department.
 *     responses:
 *       200:
 *         description: Department without parent
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.delete('/departments/:id/parent', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /departments/:id/parent', getContext());
    const useCase = new RemoveDepartmentParentDepartmentUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.id);
    if (!updated) {
      logger.warn('Department not found for parent removal', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department parent removed', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/permissions:
 *   put:
 *     summary: Add permission to department.
 *     description: |
 *       Grants a specific permission to the department. Administrator
 *       authentication is required.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department to update.
 *     requestBody:
 *       description: Permission data to add.
 *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Permission'
   *     responses:
 *       200:
 *         description: Department with new permission
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.put('/departments/:id/permissions', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /departments/:id/permissions', getContext());
    const useCase = new SetDepartmentPermissionUseCase(departmentRepository);
    const permission = new Permission(req.body.id, req.body.permissionKey, req.body.description);
    const updated = await useCase.execute(req.params.id, permission);
    if (!updated) {
      logger.warn('Department not found for permission add', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department permission added', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove a permission from department.
 *     description: |
 *       Revokes a previously granted permission from the department.
 *       Administrator authentication is required.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department.
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the permission to remove.
 *     responses:
 *       200:
 *         description: Department after permission removal
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.delete('/departments/:id/permissions/:permissionId', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /departments/:id/permissions/:permissionId', getContext());
    const useCase = new RemoveDepartmentPermissionUseCase(departmentRepository);
    const updated = await useCase.execute(req.params.id, req.params.permissionId);
    if (!updated) {
      logger.warn('Department not found for permission removal', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department permission removed', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/users/{userId}:
 *   put:
 *     summary: Attach user to department.
 *     description: |
 *       Adds an existing user to the specified department. Requires
 *       administrative privileges.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the target department.
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the user to attach.
 *     responses:
 *       200:
 *         description: Department with user attached
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.put('/departments/:id/users/:userId', async (req: Request, res: Response): Promise<void> => {
    logger.debug('PUT /departments/:id/users/:userId', getContext());
    const useCase = new AddDepartmentUserUseCase(userRepository, departmentRepository);
    const updated = await useCase.execute(req.params.userId, req.params.id);
    if (!updated) {
      logger.warn('User or department not found for add', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department user added', getContext());
    res.json(updated);
  });

  /**
   * @openapi
  * /departments/{id}/users/{userId}:
 *   delete:
 *     summary: Detach user from department.
 *     description: |
 *       Removes the association between a user and a department. Requires
 *       administrator authentication.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department.
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the user to detach.
 *     responses:
 *       200:
 *         description: Department after user removal
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Department'
   */
  router.delete('/departments/:id/users/:userId', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /departments/:id/users/:userId', getContext());
    const useCase = new RemoveDepartmentUserUseCase(userRepository);
    const updated = await useCase.execute(req.params.userId);
    if (!updated) {
      logger.warn('User not found for removal', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Department user removed', getContext());
    res.json(updated);
  });

  /**
   * @openapi
   * /departments/{id}:
 *   delete:
 *     summary: Remove a department.
 *     description: |
 *       Permanently deletes a department. The operation fails if users are
 *       still attached. Requires administrator privileges.
 *     tags:
 *       - Department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the department to delete.
 *     responses:
 *       204:
 *         description: Department successfully deleted
 *       400:
 *         description: Operation failed
   */
  router.delete('/departments/:id', async (req: Request, res: Response): Promise<void> => {
    logger.debug('DELETE /departments/:id', getContext());
    const useCase = new RemoveDepartmentUseCase(departmentRepository, userRepository);
    try {
      await useCase.execute(req.params.id);
      logger.debug('Department deleted', getContext());
      res.status(204).end();
    } catch (err) {
      logger.warn('Department deletion failed', { ...getContext(), error: err });
      res.status(400).json({ error: (err as Error).message });
    }
  });

  return router;
}
