/* istanbul ignore file */
import express, {Router} from 'express';
import {UserGroupRepositoryPort} from '../../../domain/ports/UserGroupRepositoryPort';
import {UserRepositoryPort} from '../../../domain/ports/UserRepositoryPort';
import {LoggerPort} from '../../../domain/ports/LoggerPort';
import {getContext} from '../../../infrastructure/loggerContext';
import {UserGroup} from '../../../domain/entities/UserGroup';
import {User} from '../../../domain/entities/User';
import {CreateUserGroupUseCase} from '../../../usecases/group/CreateUserGroupUseCase';
import {UpdateUserGroupUseCase} from '../../../usecases/group/UpdateUserGroupUseCase';
import {RemoveUserGroupUseCase} from '../../../usecases/group/RemoveUserGroupUseCase';
import {AddGroupUserUseCase} from '../../../usecases/group/AddGroupUserUseCase';
import {RemoveGroupUserUseCase} from '../../../usecases/group/RemoveGroupUserUseCase';
import {GetUserGroupsUseCase} from '../../../usecases/group/GetUserGroupsUseCase';
import {AddGroupResponsibleUseCase} from '../../../usecases/group/AddGroupResponsibleUseCase';
import {RemoveGroupResponsibleUseCase} from '../../../usecases/group/RemoveGroupResponsibleUseCase';
import {GetGroupMembersUseCase} from '../../../usecases/group/GetGroupMembersUseCase';
import {GetGroupResponsiblesUseCase} from '../../../usecases/group/GetGroupResponsiblesUseCase';
import {PermissionChecker} from '../../../domain/services/PermissionChecker';
import {PermissionKeys} from '../../../domain/entities/PermissionKeys';
import { TokenExpiredException } from '../../../domain/errors/TokenExpiredException';

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserGroup:
 *       description: A group of users with a responsible user and members.
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the group.
 *         name:
 *           type: string
 *           description: Group name.
 *         description:
 *           type: string
 *           description: Optional group description.
 *         responsibleUsers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: The responsible users (group managers).
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: List of users in the group.
 *       required: [id, name, responsibleUsers, members]
 */


/* istanbul ignore next */
function parseGroup(
  body: { id: string; name: string; description?: string },
  responsibles: User[],
): UserGroup {
  return new UserGroup(body.id, body.name, responsibles, [], body.description);
}

interface AuthedRequest extends express.Request {
  user: User;
}

export function createGroupRouter(
  groupRepository: UserGroupRepositoryPort,
  userRepository: UserRepositoryPort,
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
      const user = await userRepository.findById(token); // simplify for tests
      if (!user) throw new Error('auth');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).user = user;
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
     * /groups:
     *   post:
     *     summary: Create a new user group.
     *     description: Creates a new user group with the authenticated user as the responsible user.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       description: Data for the new user group.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *                 description: Identifier for the group.
     *               name:
     *                 type: string
     *                 description: Group name.
     *               description:
     *                 type: string
     *                 description: Optional group description.
     *             required:
     *               - id
     *               - name
     *     responses:
     *       201:
     *         description: The created group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.post('/groups', async (req, res): Promise<void> => {
    logger.debug('POST /groups', getContext());
    const body = req.body as { id: string; name: string; description?: string; responsibleIds: string[] };
    const responsibles = await Promise.all(
      (body.responsibleIds || []).map(id => userRepository.findById(id)),
    );
    const validResponsibles = responsibles.filter((u): u is User => !!u);
    const group = parseGroup(body, validResponsibles);
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    const useCase = new CreateUserGroupUseCase(groupRepository, checker);
    const created = await useCase.execute(group);
    res.status(201).json(created);
  });

  /**
     * @openapi
     * /groups:
     *   get:
     *     summary: List all groups.
     *     description: Returns all user groups.
     *     tags: [UserGroup]
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
     *         description: Number of groups per page.
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term on the group name.
     *     responses:
     *       200:
     *         description: Paginated group list.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/UserGroup'
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
  router.get('/groups', async (req, res): Promise<void> => {
    logger.debug('GET /groups', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    const useCase = new GetUserGroupsUseCase(groupRepository, checker);
    const result = await useCase.execute({
      page,
      limit,
      filters: {search: req.query.search as string | undefined},
    });
    if (result.items.length === 0) {
      res.status(204).end();
      return;
    }
    res.json(result);
  });

  /**
     * @openapi
     * /groups/{id}:
     *   get:
     *     summary: Get a user group by id.
     *     description: Retrieves a single user group.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     responses:
     *       200:
     *         description: The requested group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.get('/groups/:id', async (req, res): Promise<void> => {
    logger.debug('GET /groups/:id', getContext());
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    try {
      checker.check(PermissionKeys.READ_GROUP);
    } catch {
      res.status(403).end();
      return;
    }
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    res.json(group);
  });

  /**
     * @openapi
     * /groups/{id}/users:
     *   get:
     *     summary: List users of a group.
     *     description: Returns the paginated members of the specified group.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
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
     *         description: Search term on the user name.
     *     responses:
     *       200:
     *         description: Paginated list of group members.
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
     *       204:
     *         description: No content.
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.get('/groups/:id/users', async (req, res): Promise<void> => {
    logger.debug('GET /groups/:id/users', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    const useCase = new GetGroupMembersUseCase(groupRepository, checker);
    const result = await useCase.execute(req.params.id, {
      page,
      limit,
      filters: {search: req.query.search as string | undefined},
    });
    if (result.items.length === 0) {
      res.status(204).end();
      return;
    }
    res.json(result);
  });

  /**
     * @openapi
     * /groups/{id}/responsibles:
     *   get:
     *     summary: List responsible users of a group.
     *     description: Returns the paginated list of responsible users managing the group.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
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
     *         description: Search term on the user name.
     *     responses:
     *       200:
     *         description: Paginated list of responsible users.
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
     *       204:
     *         description: No content.
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: Forbidden.
     */
  router.get('/groups/:id/responsibles', async (req, res): Promise<void> => {
    logger.debug('GET /groups/:id/responsibles', getContext());
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    const useCase = new GetGroupResponsiblesUseCase(groupRepository, checker);
    const result = await useCase.execute(req.params.id, {
      page,
      limit,
      filters: {search: req.query.search as string | undefined},
    });
    if (result.items.length === 0) {
      res.status(204).end();
      return;
    }
    res.json(result);
  });

  /**
     * @openapi
     * /groups/{id}:
     *   put:
     *     summary: Update a group.
     *     description: Updates group information. Only the responsible user can modify it.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     requestBody:
     *       description: Group data to update.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: New group name.
     *               description:
     *                 type: string
     *                 description: New description.
     *     responses:
     *       200:
     *         description: Updated group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       403:
     *         description: Forbidden.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.put('/groups/:id', async (req, res): Promise<void> => {
    logger.debug('PUT /groups/:id', getContext());
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    const user = (req as unknown as AuthedRequest).user;
    if (!group.responsibleUsers.some(u => u.id === user.id)) {
      res.status(403).end();
      return;
    }
    group.name = req.body.name ?? group.name;
    group.description = req.body.description ?? group.description;
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    const useCase = new UpdateUserGroupUseCase(groupRepository, checker);
    const updated = await useCase.execute(group);
    res.json(updated);
  });

  /**
     * @openapi
     * /groups/{id}:
     *   delete:
     *     summary: Delete a group.
     *     description: Removes a group if the requester is responsible user.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     responses:
     *       204:
     *         description: Group deleted.
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       403:
     *         description: Forbidden.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.delete('/groups/:id', async (req, res): Promise<void> => {
    logger.debug('DELETE /groups/:id', getContext());
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    const user = (req as unknown as AuthedRequest).user;
    if (!group.responsibleUsers.some(u => u.id === user.id)) {
      res.status(403).end();
      return;
    }
    const checker = new PermissionChecker((req as unknown as AuthedRequest).user);
    const useCase = new RemoveUserGroupUseCase(groupRepository, checker);
    await useCase.execute(req.params.id);
    res.status(204).end();
  });

  /**
     * @openapi
     * /groups/{id}/users:
     *   post:
     *     summary: Add user to group.
     *     description: Adds a user to the group. Only the responsible user can manage members.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     requestBody:
     *       description: User identifier to add.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Identifier of the user.
     *             required: [userId]
     *     responses:
     *       200:
     *         description: Updated group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       403:
     *         description: Forbidden.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.post('/groups/:id/users', async (req, res): Promise<void> => {
    logger.debug('POST /groups/:id/users', getContext());
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    const user = (req as unknown as AuthedRequest).user;
    if (!group.responsibleUsers.some(u => u.id === user.id)) {
      res.status(403).end();
      return;
    }
    const checker = new PermissionChecker(user);
    const useCase = new AddGroupUserUseCase(groupRepository, userRepository, checker);
    const updated = await useCase.execute(req.params.id, (req.body as { userId: string }).userId);
    if (!updated) {
      res.status(404).end();
      return;
    }
    res.json(updated);
  });

  /**
     * @openapi
     * /groups/{id}/responsibles:
     *   post:
     *     summary: Add responsible user to group.
     *     description: Adds a user as responsible for the group. Only an existing responsible user can manage responsibles.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     requestBody:
     *       description: User identifier to add as responsible.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Identifier of the user.
     *             required: [userId]
     *     responses:
     *       200:
     *         description: Updated group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       403:
     *         description: Forbidden.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.post('/groups/:id/responsibles', async (req, res): Promise<void> => {
    logger.debug('POST /groups/:id/responsibles', getContext());
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    const user = (req as unknown as AuthedRequest).user;
    if (!group.responsibleUsers.some(u => u.id === user.id)) {
      res.status(403).end();
      return;
    }
    const checker = new PermissionChecker(user);
    const useCase = new AddGroupResponsibleUseCase(groupRepository, userRepository, checker);
    const updated = await useCase.execute(req.params.id, (req.body as { userId: string }).userId);
    if (!updated) {
      res.status(404).end();
      return;
    }
    res.json(updated);
  });

  /**
     * @openapi
     * /groups/{id}/users:
     *   delete:
     *     summary: Remove user from group.
     *     description: Removes a user from the group. Only the responsible user can manage members.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     requestBody:
     *       description: User identifier to remove.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Identifier of the user.
     *             required: [userId]
     *     responses:
     *       200:
     *         description: Updated group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       403:
     *         description: Forbidden.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.delete('/groups/:id/users', async (req, res): Promise<void> => {
    logger.debug('DELETE /groups/:id/users', getContext());
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    const user = (req as unknown as AuthedRequest).user;
    if (!group.responsibleUsers.some(u => u.id === user.id)) {
      res.status(403).end();
      return;
    }
    const checker = new PermissionChecker(user);
    const useCase = new RemoveGroupUserUseCase(groupRepository, userRepository, checker);
    const updated = await useCase.execute(req.params.id, (req.body as { userId: string }).userId);
    if (!updated) {
      res.status(404).end();
      return;
    }
    res.json(updated);
  });

  /**
     * @openapi
     * /groups/{id}/responsibles:
     *   delete:
     *     summary: Remove responsible user from group.
     *     description: Removes a responsible user from the group. Only an existing responsible user can manage responsibles.
     *     tags: [UserGroup]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group identifier.
     *     requestBody:
     *       description: User identifier to remove from responsible users.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Identifier of the user.
     *             required: [userId]
     *     responses:
     *       200:
     *         description: Updated group.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserGroup'
     *       404:
     *         description: Group not found.
     *       400:
     *         description: Validation error.
     *       403:
     *         description: Forbidden.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.delete('/groups/:id/responsibles', async (req, res): Promise<void> => {
    logger.debug('DELETE /groups/:id/responsibles', getContext());
    const group = await groupRepository.findById(req.params.id);
    if (!group) {
      res.status(404).end();
      return;
    }
    const user = (req as unknown as AuthedRequest).user;
    if (!group.responsibleUsers.some(u => u.id === user.id)) {
      res.status(403).end();
      return;
    }
    const checker = new PermissionChecker(user);
    const useCase = new RemoveGroupResponsibleUseCase(groupRepository, userRepository, checker);
    const updated = await useCase.execute(req.params.id, (req.body as { userId: string }).userId);
    if (!updated) {
      res.status(404).end();
      return;
    }
    res.json(updated);
  });

  return router;
}
