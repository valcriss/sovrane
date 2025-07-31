/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { User } from '../../../domain/entities/User';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { GetConfigUseCase } from '../../../usecases/config/GetConfigUseCase';
import { PasswordValidator } from '../../../domain/services/PasswordValidator';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { GetUsersUseCase } from '../../../usecases/user/GetUsersUseCase';
import { UpdateUserProfileUseCase } from '../../../usecases/user/UpdateUserProfileUseCase';
import { RegisterUserUseCase } from '../../../usecases/user/RegisterUserUseCase';
import { AuthenticateUserUseCase } from '../../../usecases/user/AuthenticateUserUseCase';
import { RequestPasswordResetUseCase } from '../../../usecases/user/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../usecases/user/ResetPasswordUseCase';
import { SetupTotpUseCase } from '../../../usecases/user/SetupTotpUseCase';
import { EnableMfaUseCase } from '../../../usecases/user/EnableMfaUseCase';
import { DisableMfaUseCase } from '../../../usecases/user/DisableMfaUseCase';
import { VerifyMfaUseCase } from '../../../usecases/user/VerifyMfaUseCase';
import { GetUserUseCase } from '../../../usecases/user/GetUserUseCase';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { getContext } from '../../../infrastructure/loggerContext';
import { AccountLockedError } from '../../../domain/errors/AccountLockedError';

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

interface RegisterPayload extends UpdatePayload {
  password: string;
}

export function registerUserGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  userRepository: UserRepositoryPort,
  audit: AuditPort,
  tokenService: TokenServicePort,
  refreshTokenRepository: RefreshTokenPort,
  getConfigUseCase: GetConfigUseCase,
  passwordValidator: PasswordValidator,
  mfaService: MfaServicePort,
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

    socket.on('user-get', async (payload: { id: string }) => {
      logger.info('user-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetUserUseCase(userRepository, checker);
      try {
        const usr = await useCase.execute(payload.id);
        if (!usr) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('user-get-response', usr);
      } catch (err) {
        /* istanbul ignore next */
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        /* istanbul ignore next */
        logger.error('user-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('user-create', async (payload: RegisterPayload) => {
      logger.info('user-create', getContext());
      if (
        !payload ||
        typeof payload.id !== 'string' ||
        typeof payload.firstName !== 'string' ||
        typeof payload.lastName !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.password !== 'string' ||
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
          (p) => new UserPermissionAssignment(new Permission(p.id, p.permissionKey, p.description)),
        ),
      );
      const useCase = new RegisterUserUseCase(
        userRepository,
        tokenService,
        passwordValidator,
        realtime,
      );
      try {
        const result = await useCase.execute(
          user,
          payload.password,
          socket.handshake.address,
          socket.handshake.headers['user-agent'] as string | undefined,
        );
        socket.emit('user-create-response', result);
      } catch (err) {
        /* istanbul ignore next */
        logger.error('user-create failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });

    socket.on('auth-login', async (payload: { email: string; password: string }) => {
      logger.info('auth-login', getContext());
      if (
        !payload ||
        typeof payload.email !== 'string' ||
        typeof payload.password !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new AuthenticateUserUseCase(
        authService,
        tokenService,
        userRepository,
        audit,
        logger,
        getConfigUseCase,
      );
      try {
        const result = await useCase.execute(
          payload.email,
          payload.password,
          socket.handshake.address,
          socket.handshake.headers['user-agent'] as string | undefined,
        );
        socket.emit('auth-login-response', result);
      } catch (err) {
        if (err instanceof AccountLockedError) {
          socket.emit('error', {
            error: err.message,
            code: 'account_locked',
            lockedUntil: err.lockedUntil.toISOString(),
          });
          return;
        }
        socket.emit('error', { error: (err as Error).message });
      }
    });

    socket.on('auth-request-reset', async (payload: { email: string }) => {
      logger.info('auth-request-reset', getContext());
      if (!payload || typeof payload.email !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new RequestPasswordResetUseCase(authService);
      try {
        await useCase.execute(payload.email);
        socket.emit('auth-request-reset-response', { success: true });
      } catch (err) {
        logger.error('auth-request-reset failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });

    socket.on('auth-reset', async (payload: { token: string; password: string }) => {
      logger.info('auth-reset', getContext());
      if (
        !payload ||
        typeof payload.token !== 'string' ||
        typeof payload.password !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        const user = await authService.verifyToken(payload.token);
        const useCase = new ResetPasswordUseCase(
          authService,
          passwordValidator,
          refreshTokenRepository,
        );
        await useCase.execute(user.id, payload.token, payload.password);
        socket.emit('auth-reset-response', { success: true });
        await realtime.broadcast('user-changed', { id: user.id });
      } catch (err) {
        logger.error('auth-reset failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });

    socket.on('auth-mfa-setup', async () => {
      logger.info('auth-mfa-setup', getContext());
      const useCase = new SetupTotpUseCase(mfaService, checker);
      try {
        const secret = await useCase.execute(authed.user);
        socket.emit('auth-mfa-setup-response', { secret });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('auth-mfa-setup failed', { ...getContext(), error: err });
      }
    });

    socket.on(
      'auth-mfa-enable',
      async (payload: { type: string; recoveryCodes?: string[] }) => {
        logger.info('auth-mfa-enable', getContext());
        if (!payload || typeof payload.type !== 'string') {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const useCase = new EnableMfaUseCase(
          userRepository,
          refreshTokenRepository,
          checker,
        );
        try {
          const updated = await useCase.execute(
            authed.user,
            payload.type,
            payload.recoveryCodes ?? [],
          );
          socket.emit('auth-mfa-enable-response', updated);
          await realtime.broadcast('user-changed', { id: updated.id });
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          logger.error('auth-mfa-enable failed', { ...getContext(), error: err });
        }
      },
    );

    socket.on('auth-mfa-disable', async () => {
      logger.info('auth-mfa-disable', getContext());
      const useCase = new DisableMfaUseCase(
        userRepository,
        mfaService,
        refreshTokenRepository,
        checker,
      );
      try {
        await useCase.execute(authed.user);
        socket.emit('auth-mfa-disable-response', { success: true });
        await realtime.broadcast('user-changed', { id: authed.user.id });
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('auth-mfa-disable failed', { ...getContext(), error: err });
      }
    });

    socket.on(
      'auth-mfa-verify',
      async (payload: { userId: string; code: string }) => {
        logger.info('auth-mfa-verify', getContext());
        if (
          !payload ||
          typeof payload.userId !== 'string' ||
          typeof payload.code !== 'string'
        ) {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const user = await userRepository.findById(payload.userId);
        if (!user) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        const useCase = new VerifyMfaUseCase(
          mfaService,
          tokenService,
          userRepository,
        );
        try {
          const result = await useCase.execute(
            user,
            payload.code,
            socket.handshake.address,
            socket.handshake.headers['user-agent'] as string | undefined,
          );
          socket.emit('auth-mfa-verify-response', result);
        } catch (err) {
          socket.emit('error', { error: (err as Error).message });
        }
      },
    );

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
          (p) => new UserPermissionAssignment(new Permission(p.id, p.permissionKey, p.description)),
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
