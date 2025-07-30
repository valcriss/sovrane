/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { InvitationRepositoryPort } from '../../../domain/ports/InvitationRepositoryPort';
import { EmailServicePort } from '../../../domain/ports/EmailServicePort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { CreateInvitationUseCase } from '../../../usecases/invitation/CreateInvitationUseCase';
import { GetInvitationUseCase } from '../../../usecases/invitation/GetInvitationUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

export function registerInvitationGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  userRepository: UserRepositoryPort,
  invitationRepository: InvitationRepositoryPort,
  emailService: EmailServicePort,
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

    socket.on(
      'invitation-create',
      async (payload: { email?: string; firstName?: string; lastName?: string; role?: string }) => {
        logger.info('invitation-create', getContext());
        if (!payload || typeof payload.email !== 'string') {
          socket.emit('error', { error: 'Invalid parameters' });
          return;
        }
        const useCase = new CreateInvitationUseCase(
          userRepository,
          invitationRepository,
          emailService,
          checker,
        );
        try {
          const invitation = await useCase.execute(payload as {
            email: string;
            firstName?: string;
            lastName?: string;
            role?: string;
          });
          socket.emit('invitation-create-response', { token: invitation.token });
          await realtime.broadcast('invitation-changed', { token: invitation.token });
        } catch (err) {
          if ((err as Error).message === 'Forbidden') {
            socket.emit('error', { error: 'Forbidden' });
            return;
          }
          if ((err as Error).message === 'User already exists' || (err as Error).message === 'Invitation already exists') {
            socket.emit('error', { error: 'Conflict' });
            return;
          }
          logger.error('invitation-create failed', { ...getContext(), error: err });
        }
      },
    );

    socket.on('invitation-fetch', async (payload: { token?: string }) => {
      logger.info('invitation-fetch', getContext());
      if (!payload || typeof payload.token !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetInvitationUseCase(invitationRepository);
      try {
        const invitation = await useCase.execute(payload.token);
        if (!invitation) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('invitation-fetch-response', {
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
        });
      } catch (err) {
        logger.error('invitation-fetch failed', { ...getContext(), error: err });
      }
    });
  });
}
