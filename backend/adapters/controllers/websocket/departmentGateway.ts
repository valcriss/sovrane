/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import {
  GetDepartmentsUseCase,
} from '../../../usecases/department/GetDepartmentsUseCase';
import { GetDepartmentUseCase } from '../../../usecases/department/GetDepartmentUseCase';
import { GetDepartmentChildrenUseCase } from '../../../usecases/department/GetDepartmentChildrenUseCase';
import { GetDepartmentManagerUseCase } from '../../../usecases/department/GetDepartmentManagerUseCase';
import { SetDepartmentManagerUseCase } from '../../../usecases/department/SetDepartmentManagerUseCase';
import { RemoveDepartmentManagerUseCase } from '../../../usecases/department/RemoveDepartmentManagerUseCase';
import { GetDepartmentParentUseCase } from '../../../usecases/department/GetDepartmentParentUseCase';
import { SetDepartmentParentDepartmentUseCase } from '../../../usecases/department/SetDepartmentParentDepartmentUseCase';
import { RemoveDepartmentParentDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentParentDepartmentUseCase';
import { GetDepartmentPermissionsUseCase } from '../../../usecases/department/GetDepartmentPermissionsUseCase';
import { SetDepartmentPermissionUseCase } from '../../../usecases/department/SetDepartmentPermissionUseCase';
import { RemoveDepartmentPermissionUseCase } from '../../../usecases/department/RemoveDepartmentPermissionUseCase';
import { AddChildDepartmentUseCase } from '../../../usecases/department/AddChildDepartmentUseCase';
import { RemoveChildDepartmentUseCase } from '../../../usecases/department/RemoveChildDepartmentUseCase';
import { AddDepartmentUserUseCase } from '../../../usecases/department/AddDepartmentUserUseCase';
import { RemoveDepartmentUserUseCase } from '../../../usecases/department/RemoveDepartmentUserUseCase';
import { CreateDepartmentUseCase } from '../../../usecases/department/CreateDepartmentUseCase';
import { UpdateDepartmentUseCase } from '../../../usecases/department/UpdateDepartmentUseCase';
import { RemoveDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

interface ListParams {
  page?: number;
  limit?: number;
  siteId?: string;
}

interface DepartmentPayload {
  id: string;
  label: string;
  parentDepartmentId?: string | null;
  managerUserId?: string | null;
  site: { id: string; label: string };
  permissions?: Array<{ id: string; permissionKey: string; description: string }>;
}

export function registerDepartmentGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  departmentRepository: DepartmentRepositoryPort,
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

    socket.on('department-list-request', async (params: ListParams) => {
      logger.info('department-list-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetDepartmentsUseCase(departmentRepository, checker);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: { siteId: params?.siteId },
        });
        socket.emit('department-list-response', result);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-list-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-get', async (payload: { id: string }) => {
      logger.info('department-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetDepartmentUseCase(departmentRepository, checker);
      try {
        const dept = await useCase.execute(payload.id);
        if (!dept) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-get-response', dept);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-create', async (payload: DepartmentPayload) => {
      logger.info('department-create', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.label !== 'string' || !payload.site) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const department = new Department(
        payload.id,
        payload.label,
        payload.parentDepartmentId ?? null,
        payload.managerUserId ?? null,
        new Site(payload.site.id, payload.site.label),
        (payload.permissions ?? []).map((p) => new Permission(p.id, p.permissionKey, p.description)),
      );
      const useCase = new CreateDepartmentUseCase(
        departmentRepository,
        checker,
        realtime,
      );
      try {
        const created = await useCase.execute(department);
        socket.emit('department-create-response', created);
        await realtime.broadcast('department-changed', { id: created.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-create failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-update', async (payload: DepartmentPayload) => {
      logger.info('department-update', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.label !== 'string' || !payload.site) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const department = new Department(
        payload.id,
        payload.label,
        payload.parentDepartmentId ?? null,
        payload.managerUserId ?? null,
        new Site(payload.site.id, payload.site.label),
        (payload.permissions ?? []).map((p) => new Permission(p.id, p.permissionKey, p.description)),
      );
      const useCase = new UpdateDepartmentUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(department);
        socket.emit('department-update-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-update failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-delete', async (payload: { id: string }) => {
      logger.info('department-delete', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RemoveDepartmentUseCase(
        departmentRepository,
        userRepository,
        checker,
      );
      try {
        await useCase.execute(payload.id);
        socket.emit('department-delete-response', { id: payload.id });
        await realtime.broadcast('department-changed', { id: payload.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-delete failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });

    socket.on('department-children-request', async (payload: { id: string } & ListParams & { search?: string }) => {
      logger.info('department-children-request', getContext());
      const page = Number(payload?.page ?? 1);
      const limit = Number(payload?.limit ?? 20);
      if (!payload || typeof payload.id !== 'string' || Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetDepartmentChildrenUseCase(departmentRepository, checker);
      try {
        const result = await useCase.execute(payload.id, {
          page,
          limit,
          filters: { siteId: payload.siteId, search: payload.search },
        });
        socket.emit('department-children-response', result);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-children-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-manager-get', async (payload: { id: string }) => {
      logger.info('department-manager-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetDepartmentManagerUseCase(
        departmentRepository,
        userRepository,
        checker,
      );
      try {
        const manager = await useCase.execute(payload.id);
        if (!manager) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-manager-response', manager);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-manager-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-manager-set', async (payload: { id: string; userId: string }) => {
      logger.info('department-manager-set', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.userId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new SetDepartmentManagerUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.id, payload.userId);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-manager-set-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-manager-set failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-manager-remove', async (payload: { id: string }) => {
      logger.info('department-manager-remove', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RemoveDepartmentManagerUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.id);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-manager-remove-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-manager-remove failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-parent-get', async (payload: { id: string }) => {
      logger.info('department-parent-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetDepartmentParentUseCase(departmentRepository, checker);
      try {
        const parent = await useCase.execute(payload.id);
        if (!parent) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-parent-response', parent);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-parent-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-parent-set', async (payload: { id: string; parentId: string }) => {
      logger.info('department-parent-set', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.parentId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new SetDepartmentParentDepartmentUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.id, payload.parentId);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-parent-set-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-parent-set failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-parent-remove', async (payload: { id: string }) => {
      logger.info('department-parent-remove', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RemoveDepartmentParentDepartmentUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.id);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-parent-remove-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-parent-remove failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-permissions-request', async (payload: { id: string } & ListParams & { search?: string }) => {
      logger.info('department-permissions-request', getContext());
      const page = Number(payload?.page ?? 1);
      const limit = Number(payload?.limit ?? 20);
      if (!payload || typeof payload.id !== 'string' || Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetDepartmentPermissionsUseCase(departmentRepository, checker);
      try {
        const result = await useCase.execute(payload.id, {
          page,
          limit,
          filters: { search: payload.search },
        });
        socket.emit('department-permissions-response', result);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-permissions-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-permission-add', async (payload: { id: string; permission: { id: string; permissionKey: string; description: string } }) => {
      logger.info('department-permission-add', getContext());
      if (!payload || typeof payload.id !== 'string' || !payload.permission || typeof payload.permission.id !== 'string' || typeof payload.permission.permissionKey !== 'string' || typeof payload.permission.description !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new SetDepartmentPermissionUseCase(departmentRepository, checker);
      const perm = new Permission(
        payload.permission.id,
        payload.permission.permissionKey,
        payload.permission.description,
      );
      try {
        const updated = await useCase.execute(payload.id, perm);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-permission-add-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-permission-add failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-permission-remove', async (payload: { id: string; permissionId: string }) => {
      logger.info('department-permission-remove', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.permissionId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RemoveDepartmentPermissionUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.id, payload.permissionId);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-permission-remove-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-permission-remove failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-add-child', async (payload: { id: string; childId: string }) => {
      logger.info('department-add-child', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.childId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new AddChildDepartmentUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.id, payload.childId);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-add-child-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-add-child failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-remove-child', async (payload: { childId: string }) => {
      logger.info('department-remove-child', getContext());
      if (!payload || typeof payload.childId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RemoveChildDepartmentUseCase(departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.childId);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-remove-child-response', updated);
        await realtime.broadcast('department-changed', { id: updated.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-remove-child failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-add-user', async (payload: { id: string; userId: string }) => {
      logger.info('department-add-user', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.userId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new AddDepartmentUserUseCase(userRepository, departmentRepository, checker);
      try {
        const updated = await useCase.execute(payload.userId, payload.id);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-add-user-response', updated);
        await realtime.broadcast('department-changed', { id: payload.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-add-user failed', { ...getContext(), error: err });
      }
    });

    socket.on('department-remove-user', async (payload: { id: string; userId: string }) => {
      logger.info('department-remove-user', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.userId !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RemoveDepartmentUserUseCase(userRepository, checker);
      try {
        const updated = await useCase.execute(payload.userId);
        if (!updated) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('department-remove-user-response', updated);
        await realtime.broadcast('department-changed', { id: payload.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('department-remove-user failed', { ...getContext(), error: err });
      }
    });
  });
}
