/* istanbul ignore file */
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { randomUUID } from 'crypto';

import { createUserRouter } from '../adapters/controllers/rest/userController';
import { createInvitationRouter } from '../adapters/controllers/rest/invitationController';
import { createRoleRouter } from '../adapters/controllers/rest/roleController';
import { createAuditRouter } from '../adapters/controllers/rest/auditController';
import { registerUserGateway } from '../adapters/controllers/websocket/userGateway';
import { PrismaUserRepository } from '../adapters/repositories/PrismaUserRepository';
import { PrismaInvitationRepository } from '../adapters/repositories/PrismaInvitationRepository';
import { PrismaRoleRepository } from '../adapters/repositories/PrismaRoleRepository';
import { PrismaPermissionRepository } from '../adapters/repositories/PrismaPermissionRepository';
import { JWTAuthServiceAdapter } from '../adapters/auth/JWTAuthServiceAdapter';
import { JWTTokenServiceAdapter } from '../adapters/token/JWTTokenServiceAdapter';
import { ConsoleLoggerAdapter } from '../adapters/logger/ConsoleLoggerAdapter';
import { ConsoleEmailServiceAdapter } from '../adapters/email/ConsoleEmailServiceAdapter';
import { LocalFileStorageAdapter } from '../adapters/storage/LocalFileStorageAdapter';
import { AvatarService } from '../domain/services/AvatarService';
import { PrismaRefreshTokenRepository } from '../adapters/repositories/PrismaRefreshTokenRepository';
import { PrismaAudit } from '../adapters/audit/PrismaAudit';
import { createPrisma } from './createPrisma';
import { withContext, getContext } from './loggerContext';

import { setupSwagger } from './swagger';
import { PrismaConfigAdapter } from '../adapters/config/PrismaConfigAdapter';
import { InMemoryCacheAdapter } from '../adapters/cache/InMemoryCacheAdapter';
import { ConfigService } from '../domain/services/ConfigService';
import { GetConfigUseCase } from '../usecases/config/GetConfigUseCase';
import { BootstapService } from '../domain/services/BootstapService';
import { PasswordValidator } from '../domain/services/PasswordValidator';

async function bootstrap(): Promise<void> {
  const logger = new ConsoleLoggerAdapter();
  const prisma = createPrisma(logger);
  await prisma.$connect();
  logger.info('Database connected');

  const userRepository = new PrismaUserRepository(prisma, logger);
  const roleRepository = new PrismaRoleRepository(prisma, logger);
  const invitationRepository = new PrismaInvitationRepository(prisma, logger);
  const permissionRepository = new PrismaPermissionRepository(prisma, logger);
  const emailService = new ConsoleEmailServiceAdapter(logger);
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
  const cache = new InMemoryCacheAdapter();
  const configService = new ConfigService(cache, configRepo);
  const passwordValidator = new PasswordValidator(configService);
  const getConfigUseCase = new GetConfigUseCase(configService);
  const bootstrapService = new BootstapService(configService, logger, permissionRepository);
  await bootstrapService.initialize();

  const authService = new JWTAuthServiceAdapter(
    process.env.JWT_SECRET ?? 'secret',
    userRepository,
    prisma,
    logger,
  );

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    withContext({ requestId: randomUUID() }, () => next());
  });

  setupSwagger(app);
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
    ),
  );
  
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer);
  registerUserGateway(io, authService, logger);

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
