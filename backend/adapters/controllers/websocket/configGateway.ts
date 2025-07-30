/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { GetConfigUseCase } from '../../../usecases/config/GetConfigUseCase';
import { UpdateConfigUseCase } from '../../../usecases/config/UpdateConfigUseCase';
import { DeleteConfigUseCase } from '../../../usecases/config/DeleteConfigUseCase';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';

interface AuthedSocket extends Socket {
  user: User;
}

interface GetPayload {
  key: string;
}

interface UpdatePayload {
  key: string;
  value: unknown;
  updatedBy: string;
}

interface DeletePayload {
  key: string;
  deletedBy: string;
}

export function registerConfigGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  getUseCase: GetConfigUseCase,
  updateUseCase: UpdateConfigUseCase,
  deleteUseCase: DeleteConfigUseCase,
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

    socket.on('config-get', async (payload: GetPayload) => {
      logger.info('config-get', getContext());
      if (!payload || typeof payload.key !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_CONFIG);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      try {
        const value = await getUseCase.execute(payload.key);
        if (value === null) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('config-get-response', { key: payload.key, value });
      } catch (err) {
        logger.error('config-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('config-update', async (payload: UpdatePayload) => {
      logger.info('config-update', getContext());
      if (
        !payload ||
        typeof payload.key !== 'string' ||
        typeof payload.updatedBy !== 'string' ||
        payload.value === undefined
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.UPDATE_CONFIG);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      try {
        await updateUseCase.execute(payload.key, payload.value, payload.updatedBy);
        socket.emit('config-update-response', {
          key: payload.key,
          value: payload.value,
        });
        await realtime.broadcast('config-changed', { key: payload.key });
      } catch (err) {
        logger.error('config-update failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });

    socket.on('config-delete', async (payload: DeletePayload) => {
      logger.info('config-delete', getContext());
      if (
        !payload ||
        typeof payload.key !== 'string' ||
        typeof payload.deletedBy !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.DELETE_CONFIG);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      try {
        await deleteUseCase.execute(payload.key, payload.deletedBy);
        socket.emit('config-delete-response', { key: payload.key });
        await realtime.broadcast('config-changed', { key: payload.key });
      } catch (err) {
        logger.error('config-delete failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });
  });
}
