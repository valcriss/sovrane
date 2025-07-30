import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerPermissionGateway } from '../../../../adapters/controllers/websocket/permissionGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { PermissionRepositoryPort } from '../../../../domain/ports/PermissionRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Permission } from '../../../../domain/entities/Permission';
import { Role } from '../../../../domain/entities/Role';
import { User } from '../../../../domain/entities/User';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Permission WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let permRepo: DeepMockProxy<PermissionRepositoryPort>;
  let permission: Permission;
  let role: Role;
  let user: User;
  let site: Site;
  let department: Department;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    permRepo = mockDeep<PermissionRepositoryPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    permission = new Permission('p', 'TEST', 'desc');
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.READ_PERMISSIONS, ''),
      new Permission('p5', PermissionKeys.READ_PERMISSION, ''),
      new Permission('p2', PermissionKeys.CREATE_PERMISSION, ''),
      new Permission('p3', PermissionKeys.UPDATE_PERMISSION, ''),
      new Permission('p4', PermissionKeys.DELETE_PERMISSION, ''),
    ]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerPermissionGateway(io, auth, logger, realtime, permRepo);
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

  it('emits permission list when permitted', (done) => {
    permRepo.findPage.mockResolvedValue({ items: [permission], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-list-request', { page: 1, limit: 20 });
    });
    client.on('permission-list-response', (data: any) => {
      expect(data.items[0].id).toBe('p');
      client.close();
      done();
    });
  });

  it('emits permission get', (done) => {
    permRepo.findById.mockResolvedValue(permission);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-get', { id: 'p' });
    });
    client.on('permission-get-response', (data: any) => {
      expect(data.id).toBe('p');
      client.close();
      done();
    });
  });

  it('rejects invalid list parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-list-request', { page: 'a' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('broadcasts permission-changed on create', (done) => {
    permRepo.create.mockResolvedValue(permission);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-create', { id: 'p', permissionKey: 'TEST', description: 'desc' });
    });
    client.on('permission-create-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('permission-changed', { id: 'p' });
      client.close();
      done();
    });
  });

  it('broadcasts permission-changed on update', (done) => {
    permRepo.update.mockResolvedValue(permission);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-update', { id: 'p', permissionKey: 'TEST', description: 'desc' });
    });
    client.on('permission-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('permission-changed', { id: 'p' });
      client.close();
      done();
    });
  });

  it('broadcasts permission-changed on delete', (done) => {
    permRepo.delete.mockResolvedValue();
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-delete', { id: 'p' });
    });
    client.on('permission-delete-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('permission-changed', { id: 'p' });
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-list-request', { page: 1, limit: 20 });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Forbidden');
      client.close();
      done();
    });
  });

  it('rejects create when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('permission-create', { id: 'p', permissionKey: 'T', description: 'd' });
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
      client.emit('permission-create', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
