import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { User } from '../../../domain/entities/User';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { getContext } from '../../../infrastructure/loggerContext';

/**
 * Register a Socket.IO gateway that authenticates connections and handles basic events.
 *
 * @param io - Socket.IO server instance.
 * @param authService - Service used to authenticate sockets.
 */
interface AuthedSocket extends Socket {
  user: User;
}

export function registerUserGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
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
    socket.on('ping', () => {
      socket.emit('pong', { userId: authed.user.id });
    });
  });
}
