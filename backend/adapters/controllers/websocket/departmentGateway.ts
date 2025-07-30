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
      const useCase = new RemoveDepartmentUseCase(departmentRepository, userRepository, checker);
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
  });
}
