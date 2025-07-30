/* istanbul ignore file */
import { Server, Socket } from 'socket.io';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RealtimePort } from '../../../domain/ports/RealtimePort';
import { SiteRepositoryPort } from '../../../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { getContext } from '../../../infrastructure/loggerContext';
import { User } from '../../../domain/entities/User';
import { Site } from '../../../domain/entities/Site';
import { CreateSiteUseCase } from '../../../usecases/site/CreateSiteUseCase';
import { UpdateSiteUseCase } from '../../../usecases/site/UpdateSiteUseCase';
import { RemoveSiteUseCase } from '../../../usecases/site/RemoveSiteUseCase';
import { GetSitesUseCase } from '../../../usecases/site/GetSitesUseCase';
import { GetSiteUseCase } from '../../../usecases/site/GetSiteUseCase';

interface AuthedSocket extends Socket {
  user: User;
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface SitePayload {
  id: string;
  label: string;
}

export function registerSiteGateway(
  io: Server,
  authService: AuthServicePort,
  logger: LoggerPort,
  realtime: RealtimePort,
  siteRepository: SiteRepositoryPort,
  userRepository: UserRepositoryPort,
  departmentRepository: DepartmentRepositoryPort,
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

    socket.on('site-list-request', async (params: ListParams) => {
      logger.info('site-list-request', getContext());
      const page = Number(params?.page ?? 1);
      const limit = Number(params?.limit ?? 20);
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1) {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_SITES);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetSitesUseCase(siteRepository);
      try {
        const result = await useCase.execute({
          page,
          limit,
          filters: { search: params?.search },
        });
        socket.emit('site-list-response', result);
      } catch (err) {
        logger.error('site-list-request failed', { ...getContext(), error: err });
      }
    });

    socket.on('site-get', async (payload: { id: string }) => {
      logger.info('site-get', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.READ_SITE);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new GetSiteUseCase(siteRepository);
      try {
        const site = await useCase.execute(payload.id);
        if (!site) {
          socket.emit('error', { error: 'Not found' });
          return;
        }
        socket.emit('site-get-response', site);
      } catch (err) {
        logger.error('site-get failed', { ...getContext(), error: err });
      }
    });

    socket.on('site-create', async (payload: SitePayload) => {
      logger.info('site-create', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.label !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.MANAGE_SITES);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const site = new Site(payload.id, payload.label);
      const useCase = new CreateSiteUseCase(siteRepository);
      try {
        const created = await useCase.execute(site);
        socket.emit('site-create-response', created);
        await realtime.broadcast('site-changed', { id: created.id });
      } catch (err) {
        logger.error('site-create failed', { ...getContext(), error: err });
      }
    });

    socket.on('site-update', async (payload: SitePayload) => {
      logger.info('site-update', getContext());
      if (!payload || typeof payload.id !== 'string' || typeof payload.label !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.MANAGE_SITES);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const site = new Site(payload.id, payload.label);
      const useCase = new UpdateSiteUseCase(siteRepository);
      try {
        const updated = await useCase.execute(site);
        socket.emit('site-update-response', updated);
        await realtime.broadcast('site-changed', { id: updated.id });
      } catch (err) {
        logger.error('site-update failed', { ...getContext(), error: err });
      }
    });

    socket.on('site-delete', async (payload: { id: string }) => {
      logger.info('site-delete', getContext());
      if (!payload || typeof payload.id !== 'string') {
        socket.emit('error', { error: 'Invalid parameters' });
        return;
      }
      try {
        checker.check(PermissionKeys.MANAGE_SITES);
      } catch {
        socket.emit('error', { error: 'Forbidden' });
        return;
      }
      const useCase = new RemoveSiteUseCase(siteRepository, userRepository, departmentRepository);
      try {
        await useCase.execute(payload.id);
        socket.emit('site-delete-response', { id: payload.id });
        await realtime.broadcast('site-changed', { id: payload.id });
      } catch (err) {
        socket.emit('error', { error: (err as Error).message });
        logger.error('site-delete failed', { ...getContext(), error: err });
      }
    });
  });
}
