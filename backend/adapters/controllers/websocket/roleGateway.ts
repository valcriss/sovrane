/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { CreateRoleUseCase } from '../../../usecases/role/CreateRoleUseCase';
import { GetRolesUseCase } from '../../../usecases/role/GetRolesUseCase';
import { GetRoleUseCase } from '../../../usecases/role/GetRoleUseCase';
import { UpdateRoleUseCase } from '../../../usecases/role/UpdateRoleUseCase';
import { RemoveRoleUseCase } from '../../../usecases/role/RemoveRoleUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface RolePayload {
  id: string;
  label: string;
  permissions?: Array<{ id: string; permissionKey: string; description: string }>;
}

export function registerRoleGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  roleRepository: RoleRepositoryPort,
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

    socket.on('role-list-request', async (params: ListParams) => {
      logger.info('role-list-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_ROLES);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetRolesUseCase(roleRepository);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: { search: params?.search },
        });
        socket.emit('role-list-response', result);
      } catch (err) {
        logger.error('role-list-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('role-get', async (payload: { id: string }) => {
      logger.info('role-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_ROLE);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetRoleUseCase(roleRepository);
      try {
        const role = await useCase.execute(payload.id);
        if (!role) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('role-get-response', role);
      } catch (err) {
        logger.error('role-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('role-create', async (payload: RolePayload) => {
      logger.info('role-create', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.label !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.CREATE_ROLE);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const role = new Role(
        payload.id,
        payload.label,
        (payload.permissions ?? []).map((p) => new Permission(p.id, p.permissionKey, p.description)),
      );
      const useCase = new CreateRoleUseCase(roleRepository);
      try {
        const created = await useCase.execute(role);
        socket.emit('role-create-response', created);
        await realtime.broadcast('role-changed', { id: created.id });
      } catch (err) {
        logger.error('role-create failed', { ...getContext(), error: err });
      }
    });

    socket.on('role-update', async (payload: RolePayload) => {
      logger.info('role-update', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.label !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.UPDATE_ROLE);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const role = new Role(
        payload.id,
        payload.label,
        (payload.permissions ?? []).map((p) => new Permission(p.id, p.permissionKey, p.description)),
      );
      const useCase = new UpdateRoleUseCase(roleRepository);
      try {
        const updated = await useCase.execute(role);
        socket.emit('role-update-response', updated);
        await realtime.broadcast('role-changed', { id: updated.id });
      } catch (err) {
        logger.error('role-update failed', { ...getContext(), error: err });
      }
    });

    socket.on('role-delete', async (payload: { id: string }) => {
      logger.info('role-delete', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.DELETE_ROLE);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new RemoveRoleUseCase(roleRepository, userRepository);
      try {
        await useCase.execute(payload.id);
        socket.emit('role-delete-response', { id: payload.id });
        await realtime.broadcast('role-changed', { id: payload.id });
      } catch (err) {
        socket.emit('error', { error: (err as Error).message });
        logger.error('role-delete failed', { ...getContext(), error: err });
      }
    });
  });
}
