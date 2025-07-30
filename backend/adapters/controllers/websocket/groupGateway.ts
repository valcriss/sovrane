/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { CreateUserGroupUseCase } from '../../../usecases/group/CreateUserGroupUseCase';
import { GetUserGroupsUseCase } from '../../../usecases/group/GetUserGroupsUseCase';
import { UpdateUserGroupUseCase } from '../../../usecases/group/UpdateUserGroupUseCase';
import { RemoveUserGroupUseCase } from '../../../usecases/group/RemoveUserGroupUseCase';
import { AddGroupUserUseCase } from '../../../usecases/group/AddGroupUserUseCase';
import { RemoveGroupUserUseCase } from '../../../usecases/group/RemoveGroupUserUseCase';
import { AddGroupResponsibleUseCase } from '../../../usecases/group/AddGroupResponsibleUseCase';
import { RemoveGroupResponsibleUseCase } from '../../../usecases/group/RemoveGroupResponsibleUseCase';
import { GetGroupMembersUseCase } from '../../../usecases/group/GetGroupMembersUseCase';
import { GetGroupResponsiblesUseCase } from '../../../usecases/group/GetGroupResponsiblesUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface GroupPayload {
  id: string;
  name: string;
  description?: string;
  responsibleIds?: string[];
}

export function registerGroupGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  groupRepository: UserGroupRepositoryPort,
  userRepository: UserRepositoryPort,
): void {
  io.use(async (socket, next): Promise<void> => {
    logger.debug('WebSocket auth middleware', getContext());
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }
    try {
      const user = await authService.verifyToken(token);
      (socket as AuthedSocket).user = user;
      logger.debug('WebSocket auth success', getContext());
      next();
    } catch {
      logger.warn('WebSocket auth failed', getContext());
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authed = socket as AuthedSocket;
    const checker = new PermissionChecker(authed.user);

    socket.on('ping', () => {
      socket.emit('pong', { userId: authed.user.id });
    });

    socket.on('group-list-request', async (params: ListParams) => {
      logger.info('group-list-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetUserGroupsUseCase(groupRepository, checker);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: { search: params?.search },
        });
        socket.emit('group-list-response', result);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('group-list-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('group-get', async (payload: { id: string }) => {
      logger.info('group-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check('read-group');
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const group = await groupRepository.findById(payload.id);
      if (!group) {
        socket.emit('error', { error: 'Not found' });
        return;
      }
      socket.emit('group-get-response', group);
    });

    socket.on(
      'group-members-request',
      async (payload: { id: string } & ListParams) => {
        logger.info('group-members-request', getContext());
        const page = Number(payload?.page ?? 1);
        const limit = Number(payload?.limit ?? 20);
        if (
          !payload ||
          typeof payload.id !== 'string' ||
          Number.isNaN(page) ||
          page < 1 ||
          Number.isNaN(limit) ||
          limit < 1
        ) {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const useCase = new GetGroupMembersUseCase(groupRepository, checker);
        try {
          const result = await useCase.execute(payload.id, {
            page,
            limit,
            filters: { search: payload.search },
          });
          socket.emit('group-members-response', result);
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('group-members-request failed', {
            ...getContext(),
            error: err,
          });
        }
      },
    );

    socket.on(
      'group-responsibles-request',
      async (payload: { id: string } & ListParams) => {
        logger.info('group-responsibles-request', getContext());
        const page = Number(payload?.page ?? 1);
        const limit = Number(payload?.limit ?? 20);
        if (
          !payload ||
          typeof payload.id !== 'string' ||
          Number.isNaN(page) ||
          page < 1 ||
          Number.isNaN(limit) ||
          limit < 1
        ) {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const useCase = new GetGroupResponsiblesUseCase(groupRepository, checker);
        try {
          const result = await useCase.execute(payload.id, {
            page,
            limit,
            filters: { search: payload.search },
          });
          socket.emit('group-responsibles-response', result);
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('group-responsibles-request failed', {
            ...getContext(),
            error: err,
          });
        }
      },
    );

    socket.on('group-create', async (payload: GroupPayload) => {
      logger.info('group-create', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.name !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const responsibles = await Promise.all(
        (payload.responsibleIds ?? []).map((id) => userRepository.findById(id)),
      );
      const valid = responsibles.filter((u): u is User => !!u);
      const group = new UserGroup(payload.id, payload.name, valid, [], payload.description);
      const useCase = new CreateUserGroupUseCase(groupRepository, checker);
      try {
        const created = await useCase.execute(group);
        socket.emit('group-create-response', created);
        await realtime.broadcast('group-changed', { id: created.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('group-create failed', { ...getContext(), error: err });
      }
    });

    socket.on('group-update', async (payload: GroupPayload) => {
      logger.info('group-update', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const group = await groupRepository.findById(payload.id);
      if (!group) {
        socket.emit('error', { error: 'Not found' });
        return;
      }
      if (!group.responsibleUsers.some((u) => u.id === authed.user.id)) {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      group.name = payload.name ?? group.name;
      group.description = payload.description ?? group.description;
      const useCase = new UpdateUserGroupUseCase(groupRepository, checker);
      try {
        const updated = await useCase.execute(group);
        socket.emit('group-update-response', updated);
        await realtime.broadcast('group-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('group-update failed', { ...getContext(), error: err });
      }
    });

    socket.on('group-delete', async (payload: { id: string }) => {
      logger.info('group-delete', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const group = await groupRepository.findById(payload.id);
      if (!group) {
        socket.emit('error', { error: 'Not found' });
        return;
      }
      if (!group.responsibleUsers.some((u) => u.id === authed.user.id)) {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new RemoveUserGroupUseCase(groupRepository, checker);
      try {
        await useCase.execute(payload.id);
        socket.emit('group-delete-response', { id: payload.id });
        await realtime.broadcast('group-changed', { id: payload.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('group-delete failed', { ...getContext(), error: err });
      }
    });

    socket.on(
      'group-add-user',
      async (payload: { groupId: string; userId: string }) => {
        logger.info('group-add-user', getContext());
        if (!payload || typeof payload.groupId !== 'string' || typeof payload.userId !== 'string') {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const group = await groupRepository.findById(payload.groupId);
        if (!group) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        if (!group.responsibleUsers.some((u) => u.id === authed.user.id)) {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        const useCase = new AddGroupUserUseCase(groupRepository, userRepository, checker);
        try {
          const updated = await useCase.execute(payload.groupId, payload.userId);
          if (!updated) {
            socket.emit('error', { error: 'Not found' });
            return;
          }
          socket.emit('group-add-user-response', updated);
          await realtime.broadcast('group-changed', { id: updated.id });
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('group-add-user failed', { ...getContext(), error: err });
        }
      },
    );

    socket.on(
      'group-remove-user',
      async (payload: { groupId: string; userId: string }) => {
        logger.info('group-remove-user', getContext());
        if (!payload || typeof payload.groupId !== 'string' || typeof payload.userId !== 'string') {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const group = await groupRepository.findById(payload.groupId);
        if (!group) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        if (!group.responsibleUsers.some((u) => u.id === authed.user.id)) {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        const useCase = new RemoveGroupUserUseCase(groupRepository, userRepository, checker);
        try {
          const updated = await useCase.execute(payload.groupId, payload.userId);
          if (!updated) {
            socket.emit('error', { error: 'Not found' });
            return;
          }
          socket.emit('group-remove-user-response', updated);
          await realtime.broadcast('group-changed', { id: updated.id });
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('group-remove-user failed', { ...getContext(), error: err });
        }
      },
    );

    socket.on(
      'group-add-responsible',
      async (payload: { groupId: string; userId: string }) => {
        logger.info('group-add-responsible', getContext());
        if (!payload || typeof payload.groupId !== 'string' || typeof payload.userId !== 'string') {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const group = await groupRepository.findById(payload.groupId);
        if (!group) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        if (!group.responsibleUsers.some((u) => u.id === authed.user.id)) {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        const useCase = new AddGroupResponsibleUseCase(groupRepository, userRepository, checker);
        try {
          const updated = await useCase.execute(payload.groupId, payload.userId);
          if (!updated) {
            socket.emit('error', { error: 'Not found' });
            return;
          }
          socket.emit('group-add-responsible-response', updated);
          await realtime.broadcast('group-changed', { id: updated.id });
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('group-add-responsible failed', { ...getContext(), error: err });
        }
      },
    );

    socket.on(
      'group-remove-responsible',
      async (payload: { groupId: string; userId: string }) => {
        logger.info('group-remove-responsible', getContext());
        if (!payload || typeof payload.groupId !== 'string' || typeof payload.userId !== 'string') {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const group = await groupRepository.findById(payload.groupId);
        if (!group) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        if (!group.responsibleUsers.some((u) => u.id === authed.user.id)) {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        const useCase = new RemoveGroupResponsibleUseCase(groupRepository, userRepository, checker);
        try {
          const updated = await useCase.execute(payload.groupId, payload.userId);
          if (!updated) {
            socket.emit('error', { error: 'Not found' });
            return;
          }
          socket.emit('group-remove-responsible-response', updated);
          await realtime.broadcast('group-changed', { id: updated.id });
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('group-remove-responsible failed', { ...getContext(), error: err });
        }
      },
    );
  });
}
