import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerUserGateway } from '../../../../adapters/controllers/websocket/userGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../../domain/ports/AuditPort';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';

describe('User WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let audit: DeepMockProxy<AuditPort>;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    userRepo = mockDeep<UserRepositoryPort>();
    audit = mockDeep<AuditPort>();
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.READ_USERS, ''),
      new Permission('p2', PermissionKeys.UPDATE_USER, ''),
    ]);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerUserGateway(io, auth, logger, realtime, userRepo, audit);
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

  it('emits user list when permitted', (done) => {
    userRepo.findPage.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-list-request', { page: 1, limit: 20 });
    });
    client.on('user-list-response', (data: any) => {
      expect(data.items[0].id).toBe('u');
      client.close();
      done();
    });
  });

  it('rejects invalid list parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-list-request', { page: 'a' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('broadcasts user-changed on update', (done) => {
    userRepo.update.mockResolvedValue(user);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-update', {
        id: 'u',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: [{ id: 'r', label: 'Role' }],
        permissions: [{ id: 'p', permissionKey: 'some', description: '' }],
        department: { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
      });
    });
    client.on('user-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('user-changed', { id: 'u' });
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    // user without permissions
    auth.verifyToken.mockResolvedValue(new User('u2', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-list-request', { page: 1, limit: 20 });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Forbidden');
      client.close();
      done();
    });
  });

  it('rejects update when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('u2', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-update', {
        id: 'u',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        department: { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
      });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Forbidden');
      client.close();
      done();
    });
  });

  it('rejects invalid update payload', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-update', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
