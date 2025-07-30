import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerInvitationGateway } from '../../../../adapters/controllers/websocket/invitationGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { InvitationRepositoryPort } from '../../../../domain/ports/InvitationRepositoryPort';
import { EmailServicePort } from '../../../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Invitation } from '../../../../domain/entities/Invitation';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { User } from '../../../../domain/entities/User';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Invitation WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let invitationRepo: DeepMockProxy<InvitationRepositoryPort>;
  let email: DeepMockProxy<EmailServicePort>;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    userRepo = mockDeep<UserRepositoryPort>();
    invitationRepo = mockDeep<InvitationRepositoryPort>();
    email = mockDeep<EmailServicePort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.CREATE_INVITATION, ''),
    ]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    auth.verifyToken.mockResolvedValue(user);
    registerInvitationGateway(
      io,
      auth,
      logger,
      realtime,
      userRepo,
      invitationRepo,
      email,
    );
    httpServer.listen(() => {
      const address = httpServer.address() as any;
      url = `http://localhost:${address.port}`;
      done();
    });
  });

  afterEach((done) => {
    io.close();
    httpServer.close(done);
  });

  it('should authenticate socket connections', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('ping');
    });
    client.on('pong', (data: unknown) => {
      expect(data).toEqual({ userId: 'u' });
      client.close();
      done();
    });
  });

  it('should reject invalid token', (done) => {
    auth.verifyToken.mockRejectedValue(new Error('bad'));
    const client = ioClient.connect(url, { auth: { token: 'bad' } });
    client.on('connect_error', (err: Error) => {
      expect(err.message).toBe('Unauthorized');
      client.close();
      done();
    });
  });

  it('should reject connection without token', (done) => {
    const client = ioClient.connect(url);
    client.on('connect_error', (err: Error) => {
      expect(err.message).toBe('Unauthorized');
      client.close();
      done();
    });
  });

  it('creates invitation when permitted', (done) => {
    invitationRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null as any);
    invitationRepo.create.mockImplementation(async (i) => i);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('invitation-create', { email: 'new@test.com' });
    });
    client.on('invitation-create-response', (data: any) => {
      expect(typeof data.token).toBe('string');
      expect(invitationRepo.create).toHaveBeenCalled();
      expect(realtime.broadcast).toHaveBeenCalledWith('invitation-changed', { token: data.token });
      client.close();
      done();
    });
  });

  it('fetches invitation info', (done) => {
    invitationRepo.findByToken.mockResolvedValue(
      new Invitation('a', 't', 'pending', new Date(Date.now() + 1000)),
    );
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('invitation-fetch', { token: 't' });
    });
    client.on('invitation-fetch-response', (data: any) => {
      expect(data.email).toBe('a');
      client.close();
      done();
    });
  });

  it('returns not found for invalid token', (done) => {
    invitationRepo.findByToken.mockResolvedValue(null);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('invitation-fetch', { token: 'x' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Not found');
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('u2', 'A', 'B', 'a@b.c', [], 'active', dept, site));
    const client = ioClient.connect(url, { auth: { token: 't' } });
    client.on('connect', () => {
      client.emit('invitation-create', { email: 'a@test.com' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Forbidden');
      client.close();
      done();
    });
  });

  it('rejects invalid create payload', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('invitation-create', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
