import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { randomUUID } from 'crypto';

import { createUserRouter } from '../adapters/controllers/rest/userController';
import { createInvitationRouter } from '../adapters/controllers/rest/invitationController';
import { registerUserGateway } from '../adapters/controllers/websocket/userGateway';
import { PrismaUserRepository } from '../adapters/repositories/PrismaUserRepository';
import { PrismaInvitationRepository } from '../adapters/repositories/PrismaInvitationRepository';
import { JWTAuthServiceAdapter } from '../adapters/auth/JWTAuthServiceAdapter';
import { ConsoleLoggerAdapter } from '../adapters/logger/ConsoleLoggerAdapter';
import { ConsoleEmailServiceAdapter } from '../adapters/email/ConsoleEmailServiceAdapter';
import { LocalFileStorageAdapter } from '../adapters/storage/LocalFileStorageAdapter';
import { AvatarService } from '../domain/services/AvatarService';
import { createPrisma } from './createPrisma';
import { withContext, getContext } from './loggerContext';

import { setupSwagger } from './swagger';

async function bootstrap(): Promise<void> {
  const logger = new ConsoleLoggerAdapter();
  const prisma = createPrisma(logger);
  await prisma.$connect();
  logger.info('Database connected');

  const userRepository = new PrismaUserRepository(prisma, logger);
  const invitationRepository = new PrismaInvitationRepository(prisma, logger);
  const emailService = new ConsoleEmailServiceAdapter(logger);
  const storage = new LocalFileStorageAdapter(process.env.STORAGE_PATH ?? './uploads', logger);
  const avatarService = new AvatarService(storage, userRepository, logger);

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
      avatarService,
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
