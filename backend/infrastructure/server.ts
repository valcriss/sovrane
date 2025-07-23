import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import { createUserRouter } from '../adapters/controllers/rest/userController';
import { registerUserGateway } from '../adapters/controllers/websocket/userGateway';
import { PrismaUserRepository } from '../adapters/repositories/PrismaUserRepository';
import { JWTAuthServiceAdapter } from '../adapters/auth/JWTAuthServiceAdapter';

async function bootstrap(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('Database connected');

  const userRepository = new PrismaUserRepository(prisma);

  const authService = new JWTAuthServiceAdapter(
    process.env.JWT_SECRET ?? 'secret',
    userRepository,
  );

  const app = express();
  app.use(express.json());

  app.use('/api', createUserRouter(authService, userRepository));

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer);
  registerUserGateway(io, authService);

  const port = parseInt(process.env.PORT ?? '3000', 10);
  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
