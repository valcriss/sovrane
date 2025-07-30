/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { User } from '../../../domain/entities/User';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { GetUsersUseCase } from '../../../usecases/user/GetUsersUseCase';
import { UpdateUserProfileUseCase } from '../../../usecases/user/UpdateUserProfileUseCase';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { getContext } from '../../../infrastructure/loggerContext';

/**
 * Register a Socket.IO gateway that authenticates connections and handles basic events.
 *
 * @param io - Socket.IO server instance.
 * @param authService - Service used to authenticate sockets.
 * @param realtime - Adapter used for emitting socket events.
 */
interface AuthedSocket extends Socket {
  user: User;
}

interface UserListParams {
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

interface UpdatePayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: 'active' | 'suspended' | 'archived';
  department: {
    id: string;
    label: string;
    parentDepartmentId?: string | null;
    managerUserId?: string | null;
    site: { id: string; label: string };
  };
  site: { id: string; label: string };
  picture?: string;
  roles?: Array<{ id: string; label: string }>;
  permissions?: Array<{ id: string; permissionKey: string; description: string }>;
}

export function registerUserGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  userRepository: UserRepositoryPort,
  audit: AuditPort,
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

    socket.on('user-list-request', async (params: UserListParams) => {
      logger.info('user-list-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      /* istanbul ignore next */
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetUsersUseCase(userRepository, checker);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: params?.filters,
        });
        logger.debug('Sending user list', getContext());
        socket.emit('user-list-response', result);
      } /* istanbul ignore next */ catch (err) {
        /* istanbul ignore next */
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        /* istanbul ignore next */
        logger.error('user-list-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('user-update', async (payload: UpdatePayload) => {
      logger.info('user-update', getContext());
      /* istanbul ignore next */
      if (
        !payload ||
        typeof payload.id !== 'string' ||
        typeof payload.firstName !== 'string' ||
        typeof payload.lastName !== 'string' ||
        typeof payload.email !== 'string' ||
        !payload.department ||
        !payload.site
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const user = new User(
        payload.id,
        payload.firstName,
        payload.lastName,
        payload.email,
        (payload.roles ?? []).map((r) => new Role(r.id, r.label)),
        payload.status ?? 'active',
        new Department(
          payload.department.id,
          payload.department.label,
          payload.department.parentDepartmentId ?? null,
          payload.department.managerUserId ?? null,
          new Site(payload.department.site.id, payload.department.site.label),
        ),
        new Site(payload.site.id, payload.site.label),
        payload.picture,
        (payload.permissions ?? []).map(
          (p) => new Permission(p.id, p.permissionKey, p.description),
        ),
      );
      const useCase = new UpdateUserProfileUseCase(
        userRepository,
        checker,
        audit,
        realtime,
      );
      try {
        const updated = await useCase.execute(user);
        logger.debug('User updated', getContext());
        socket.emit('user-update-response', updated);
        await realtime.broadcast('user-changed', { id: updated.id });
      } /* istanbul ignore next */ catch (err) {
        /* istanbul ignore next */
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        /* istanbul ignore next */
        logger.error('user-update failed', { ...getContext(), error: err });
      }
    });
  });
}
