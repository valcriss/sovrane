/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { GetAuditLogsUseCase } from '../../../usecases/audit/GetAuditLogsUseCase';
import { GetAuditConfigUseCase } from '../../../usecases/audit/GetAuditConfigUseCase';
import { UpdateAuditConfigUseCase } from '../../../usecases/audit/UpdateAuditConfigUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

interface LogParams {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ConfigPayload {
  levels: string[];
  categories: string[];
  updatedBy: string;
}

export function registerAuditGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  audit: AuditPort,
  configService: AuditConfigService,
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

    socket.on('audit-log-request', async (params: LogParams) => {
      logger.info('audit-log-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      const useCase = new GetAuditLogsUseCase(audit, checker, configService);
      try {
        const result = await useCase.execute({
          page,
          limit,
          actorId: params?.actorId,
          action: params?.action,
          targetType: params?.targetType,
          dateFrom: params?.dateFrom ? new Date(params.dateFrom) : undefined,
          dateTo: params?.dateTo ? new Date(params.dateTo) : undefined,
        });
        socket.emit('audit-log-response', result);
      } catch (err) {
        if ((err as Error).message === 'Forbidden') {
          socket.emit('error', { error: 'Forbidden' });
          return;
        }
        logger.error('audit-log-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('audit-config-get', async () => {
      logger.info('audit-config-get', getContext());
      try {
        checker.check(PermissionKeys.READ_AUDIT_CONFIG);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetAuditConfigUseCase(configService);
      try {
        const cfg = await useCase.execute();
        socket.emit('audit-config-get-response', cfg);
      } catch (err) {
        logger.error('audit-config-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('audit-config-update', async (payload: ConfigPayload) => {
      logger.info('audit-config-update', getContext());
      if (
        !payload ||
        !Array.isArray(payload.levels) ||
        !Array.isArray(payload.categories) ||
        typeof payload.updatedBy !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.WRITE_AUDIT_CONFIG);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new UpdateAuditConfigUseCase(configService, audit);
      try {
        const cfg = await useCase.execute(
          payload.levels,
          payload.categories,
          payload.updatedBy,
        );
        socket.emit('audit-config-update-response', cfg);
        await realtime.broadcast('audit-config-changed', { updatedBy: cfg.updatedBy });
      } catch (err) {
        logger.error('audit-config-update failed', { ...getContext(), error: err });
        socket.emit('error', { error: (err as Error).message });
      }
    });
  });
}
