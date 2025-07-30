import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerRoleGateway } from '../../../../adapters/controllers/websocket/roleGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { RoleRepositoryPort } from '../../../../domain/ports/RoleRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { User } from '../../../../domain/entities/User';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Role WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let roleRepo: DeepMockProxy<RoleRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
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
    roleRepo = mockDeep<RoleRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.READ_ROLES, ''),
      new Permission('p2', PermissionKeys.CREATE_ROLE, ''),
      new Permission('p3', PermissionKeys.UPDATE_ROLE, ''),
      new Permission('p4', PermissionKeys.DELETE_ROLE, ''),
    ]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerRoleGateway(io, auth, logger, realtime, roleRepo, userRepo);
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

  it('emits role list when permitted', (done) => {
    roleRepo.findPage.mockResolvedValue({ items: [role], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('role-list-request', { page: 1, limit: 20 });
    });
    client.on('role-list-response', (data: any) => {
      expect(data.items[0].id).toBe('r');
      client.close();
      done();
    });
  });

  it('rejects invalid list parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('role-list-request', { page: 'a' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('broadcasts role-changed on create', (done) => {
    roleRepo.create.mockResolvedValue(role);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('role-create', { id: 'r', label: 'Role' });
    });
    client.on('role-create-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('role-changed', { id: 'r' });
      client.close();
      done();
    });
  });

  it('broadcasts role-changed on update', (done) => {
    roleRepo.update.mockResolvedValue(role);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('role-update', { id: 'r', label: 'Role' });
    });
    client.on('role-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('role-changed', { id: 'r' });
      client.close();
      done();
    });
  });

  it('broadcasts role-changed on delete', (done) => {
    roleRepo.delete.mockResolvedValue();
    userRepo.findByRoleId.mockResolvedValue([]);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('role-delete', { id: 'r' });
    });
    client.on('role-delete-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('role-changed', { id: 'r' });
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('role-list-request', { page: 1, limit: 20 });
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
      client.emit('role-create', { id: 'r', label: 'Role' });
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
      client.emit('role-create', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
