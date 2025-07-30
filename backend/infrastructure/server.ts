/* istanbul ignore file */
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter as createSocketIORedisAdapter } from '@socket.io/redis-adapter';
import { randomUUID } from 'crypto';

import { createUserRouter } from '../adapters/controllers/rest/userController';
import { createInvitationRouter } from '../adapters/controllers/rest/invitationController';
import { createRoleRouter } from '../adapters/controllers/rest/roleController';
import { createAuditRouter } from '../adapters/controllers/rest/auditController';
import { registerUserGateway } from '../adapters/controllers/websocket/userGateway';
import { SocketIORealtimeAdapter } from '../adapters/realtime/SocketIORealtimeAdapter';
import { PrismaUserRepository } from '../adapters/repositories/PrismaUserRepository';
import { PrismaInvitationRepository } from '../adapters/repositories/PrismaInvitationRepository';
import { PrismaRoleRepository } from '../adapters/repositories/PrismaRoleRepository';
import { PrismaPermissionRepository } from '../adapters/repositories/PrismaPermissionRepository';
import { JWTAuthServiceAdapter } from '../adapters/auth/JWTAuthServiceAdapter';
import { JWTTokenServiceAdapter } from '../adapters/token/JWTTokenServiceAdapter';
import { ConsoleLoggerAdapter } from '../adapters/logger/ConsoleLoggerAdapter';
import { ConsoleEmailServiceAdapter } from '../adapters/email/ConsoleEmailServiceAdapter';
import { NodemailerEmailServiceAdapter } from '../adapters/email/NodemailerEmailServiceAdapter';
import { EmailNotificationAdapter } from '../adapters/notification/EmailNotificationAdapter';
import { LocalFileStorageAdapter } from '../adapters/storage/LocalFileStorageAdapter';
import { AvatarService } from '../domain/services/AvatarService';
import { PrismaRefreshTokenRepository } from '../adapters/repositories/PrismaRefreshTokenRepository';
import { PrismaAudit } from '../adapters/audit/PrismaAudit';
import { PrismaAuditConfigAdapter } from '../adapters/audit/PrismaAuditConfigAdapter';
import { AuditConfigService } from '../domain/services/AuditConfigService';
import { GetAuditConfigUseCase } from '../usecases/audit/GetAuditConfigUseCase';
import { UpdateAuditConfigUseCase } from '../usecases/audit/UpdateAuditConfigUseCase';
import { createPrisma } from './createPrisma';
import { withContext, getContext } from './loggerContext';

import { setupSwagger } from './swagger';
import { PrismaConfigAdapter } from '../adapters/config/PrismaConfigAdapter';
import { InMemoryCacheAdapter } from '../adapters/cache/InMemoryCacheAdapter';
import { RedisCacheAdapter } from '../adapters/cache/RedisCacheAdapter';
import IORedis from 'ioredis';
import { ConfigService } from '../domain/services/ConfigService';
import { GetConfigUseCase } from '../usecases/config/GetConfigUseCase';
import { BootstapService } from '../domain/services/BootstapService';
import { PasswordValidator } from '../domain/services/PasswordValidator';
import { NodeCronScheduler } from '../adapters/scheduler/NodeCronScheduler';
import { createScheduledJobs } from '../adapters/scheduler/jobs';
import { TOTPAdapter } from '../adapters/mfa/TOTPAdapter';
import { createSensitiveRouteAuditMiddleware } from './sensitiveRouteAuditMiddleware';

async function bootstrap(): Promise<void> {
  const logger = new ConsoleLoggerAdapter();
  const prisma = createPrisma(logger);
  await prisma.$connect();
  logger.info('Database connected');

  const userRepository = new PrismaUserRepository(prisma, logger);
  const roleRepository = new PrismaRoleRepository(prisma, logger);
  const invitationRepository = new PrismaInvitationRepository(prisma, logger);
  const permissionRepository = new PrismaPermissionRepository(prisma, logger);
  const emailService = process.env.SMTP_HOST && process.env.SMTP_HOST.trim()
    ? new NodemailerEmailServiceAdapter(
      {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USERNAME
          ? {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
          }
          : undefined,
      },
      process.env.EMAIL_TEMPLATES_PATH ?? 'templates',
      logger,
    )
    : new ConsoleEmailServiceAdapter(logger);
  const notificationService = new EmailNotificationAdapter(emailService, logger);
  const storage = new LocalFileStorageAdapter(process.env.STORAGE_PATH ?? './uploads', logger);
  const avatarService = new AvatarService(storage, userRepository, logger);

  const refreshRepo = new PrismaRefreshTokenRepository(prisma, logger);
  const tokenService = new JWTTokenServiceAdapter(
    process.env.JWT_SECRET ?? 'secret',
    refreshRepo,
    logger,
  );
  const audit = new PrismaAudit(prisma, logger);

  const configRepo = new PrismaConfigAdapter(prisma, logger);
  const cache = process.env.REDIS_HOST && process.env.REDIS_HOST.trim()
    ? new RedisCacheAdapter(
      new IORedis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      }),
    )
    : new InMemoryCacheAdapter();
  const auditConfigRepo = new PrismaAuditConfigAdapter(prisma, logger);
  const auditConfigService = new AuditConfigService(cache, auditConfigRepo);
  const getAuditConfigUseCase = new GetAuditConfigUseCase(auditConfigService);
  const updateAuditConfigUseCase = new UpdateAuditConfigUseCase(
    auditConfigService,
    audit,
  );
  const configService = new ConfigService(cache, configRepo);
  const passwordValidator = new PasswordValidator(configService);
  const mfaService = new TOTPAdapter(
    userRepository,
    cache,
    logger,
    process.env.MFA_ENCRYPTION_KEY ??
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'.slice(0, 64),
  );
  const getConfigUseCase = new GetConfigUseCase(configService);
  const bootstrapService = new BootstapService(
    configService,
    logger,
    permissionRepository,
    auditConfigService,
  );
  await bootstrapService.initialize();

  const authService = new JWTAuthServiceAdapter(
    process.env.JWT_SECRET ?? 'secret',
    userRepository,
    prisma,
    logger,
  );

  const auditMiddleware = createSensitiveRouteAuditMiddleware(
    audit,
    authService,
    getConfigUseCase,
    logger,
  );

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    withContext({ requestId: randomUUID() }, () => next());
  });

  setupSwagger(app);
  app.use('/api', auditMiddleware);
  app.use(
    '/api',
    createInvitationRouter(
      authService,
      userRepository,
      invitationRepository,
      emailService,
      logger,
    ),
  );
  app.use(
    '/api',
    createUserRouter(
      authService,
      userRepository,
      audit,
      avatarService,
      tokenService,
      refreshRepo,
      logger,
      getConfigUseCase,
      passwordValidator,
      mfaService,
    ),
  );
  app.use(
    '/api',
    createRoleRouter(
      roleRepository,
      userRepository,
      logger,
    ),
  );
  app.use(
    '/api',
    createAuditRouter(
      authService,
      userRepository,
      audit,
      logger,
      auditConfigService,
      getAuditConfigUseCase,
      updateAuditConfigUseCase,
    ),
  );
  
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer);
  const realtime = new SocketIORealtimeAdapter(io, logger);
  if (process.env.REDIS_HOST && process.env.REDIS_HOST.trim()) {
    const pubClient = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    });
    const subClient = pubClient.duplicate();
    io.adapter(createSocketIORedisAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured', getContext());
  }
  registerUserGateway(
    io,
    authService,
    logger,
    realtime,
    userRepository,
    audit,
  );

  const scheduler = new NodeCronScheduler(logger);
  scheduler.registerJobs(
    createScheduledJobs({
      userRepository,
      mailer: emailService,
      config: getConfigUseCase,
      audit,
      notification: notificationService,
      logger,
    }),
  );

  const port = parseInt(process.env.PORT ?? '3000', 10);
  httpServer.listen(port, () => {
    logger.info(`Server listening on port ${port}`, getContext());
  });
}

bootstrap().catch((err) => {
  const logger = new ConsoleLoggerAdapter();
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
