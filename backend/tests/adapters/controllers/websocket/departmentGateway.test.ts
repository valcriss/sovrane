import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerDepartmentGateway } from '../../../../adapters/controllers/websocket/departmentGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { DepartmentRepositoryPort } from '../../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Department WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let department: Department;
  let site: Site;
  let role: Role;
  let user: User;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.READ_DEPARTMENTS, ''),
      new Permission('p2', PermissionKeys.CREATE_DEPARTMENT, ''),
      new Permission('p3', PermissionKeys.UPDATE_DEPARTMENT, ''),
      new Permission('p4', PermissionKeys.DELETE_DEPARTMENT, ''),
    ]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerDepartmentGateway(io, auth, logger, realtime, deptRepo, userRepo);
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
    client.on('pong', (data: any) => {
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

  it('emits department list when permitted', (done) => {
    deptRepo.findPage.mockResolvedValue({ items: [department], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('department-list-request', { page: 1, limit: 20 });
    });
    client.on('department-list-response', (data: any) => {
      expect(data.items[0].id).toBe('d');
      client.close();
      done();
    });
  });

  it('rejects invalid list parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('department-list-request', { page: 'a' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('broadcasts department-changed on create', (done) => {
    deptRepo.create.mockResolvedValue(department);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('department-create', { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } });
    });
    client.on('department-create-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('department-changed', { id: 'd' });
      client.close();
      done();
    });
  });

  it('broadcasts department-changed on update', (done) => {
    deptRepo.update.mockResolvedValue(department);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('department-update', { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } });
    });
    client.on('department-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('department-changed', { id: 'd' });
      client.close();
      done();
    });
  });

  it('broadcasts department-changed on delete', (done) => {
    deptRepo.delete.mockResolvedValue();
    userRepo.findByDepartmentId.mockResolvedValue([]);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('department-delete', { id: 'd' });
    });
    client.on('department-delete-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('department-changed', { id: 'd' });
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('u2', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 't' } });
    client.on('connect', () => {
      client.emit('department-list-request', { page: 1, limit: 20 });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Forbidden');
      client.close();
      done();
    });
  });

  it('rejects create when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('u2', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 't' } });
    client.on('connect', () => {
      client.emit('department-create', { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } });
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
      client.emit('department-create', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
