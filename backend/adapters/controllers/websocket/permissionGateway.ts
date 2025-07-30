/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { Permission } from '../../../domain/entities/Permission';
import { GetPermissionsUseCase } from '../../../usecases/permission/GetPermissionsUseCase';
import { GetPermissionUseCase } from '../../../usecases/permission/GetPermissionUseCase';
import { CreatePermissionUseCase } from '../../../usecases/permission/CreatePermissionUseCase';
import { UpdatePermissionUseCase } from '../../../usecases/permission/UpdatePermissionUseCase';
import { RemovePermissionUseCase } from '../../../usecases/permission/RemovePermissionUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface PermissionPayload {
  id: string;
  permissionKey: string;
  description: string;
}

export function registerPermissionGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  permissionRepository: PermissionRepositoryPort,
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

    socket.on('permission-list-request', async (params: ListParams) => {
      logger.info('permission-list-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_PERMISSIONS);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetPermissionsUseCase(permissionRepository);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: { search: params?.search },
        });
        socket.emit('permission-list-response', result);
      } catch (err) {
        logger.error('permission-list-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('permission-get', async (payload: { id: string }) => {
      logger.info('permission-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_PERMISSION);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetPermissionUseCase(permissionRepository);
      try {
        const permission = await useCase.execute(payload.id);
        if (!permission) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('permission-get-response', permission);
      } catch (err) {
        logger.error('permission-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('permission-create', async (payload: PermissionPayload) => {
      logger.info('permission-create', getContext());
      if (
        !payload ||
        typeof payload.id !== 'string' ||
        typeof payload.permissionKey !== 'string' ||
        typeof payload.description !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.CREATE_PERMISSION);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const permission = new Permission(payload.id, payload.permissionKey, payload.description);
      const useCase = new CreatePermissionUseCase(permissionRepository);
      try {
        const created = await useCase.execute(permission);
        socket.emit('permission-create-response', created);
        await realtime.broadcast('permission-changed', { id: created.id });
      } catch (err) {
        logger.error('permission-create failed', { ...getContext(), error: err });
      }
    });

    socket.on('permission-update', async (payload: PermissionPayload) => {
      logger.info('permission-update', getContext());
      if (
        !payload ||
        typeof payload.id !== 'string' ||
        typeof payload.permissionKey !== 'string' ||
        typeof payload.description !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.UPDATE_PERMISSION);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const permission = new Permission(payload.id, payload.permissionKey, payload.description);
      const useCase = new UpdatePermissionUseCase(permissionRepository);
      try {
        const updated = await useCase.execute(permission);
        socket.emit('permission-update-response', updated);
        await realtime.broadcast('permission-changed', { id: updated.id });
      } catch (err) {
        logger.error('permission-update failed', { ...getContext(), error: err });
      }
    });

    socket.on('permission-delete', async (payload: { id: string }) => {
      logger.info('permission-delete', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.DELETE_PERMISSION);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new RemovePermissionUseCase(permissionRepository);
      try {
        await useCase.execute(payload.id);
        socket.emit('permission-delete-response', { id: payload.id });
        await realtime.broadcast('permission-changed', { id: payload.id });
      } catch (err) {
        logger.error('permission-delete failed', { ...getContext(), error: err });
      }
    });
  });
}
