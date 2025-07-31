import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerSiteGateway } from '../../../../adapters/controllers/websocket/siteGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { SiteRepositoryPort } from '../../../../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../../domain/ports/DepartmentRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Site } from '../../../../domain/entities/Site';
import { Department } from '../../../../domain/entities/Department';
import { Role } from '../../../../domain/entities/Role';
import { User } from '../../../../domain/entities/User';
import { Permission } from '../../../../domain/entities/Permission';
import { RolePermissionAssignment } from '../../../../domain/entities/RolePermissionAssignment';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Site WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let siteRepo: DeepMockProxy<SiteRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let site: Site;
  let department: Department;
  let role: Role;
  let user: User;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    siteRepo = mockDeep<SiteRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [new RolePermissionAssignment(new Permission('p1', PermissionKeys.READ_SITES, '')), new RolePermissionAssignment(new Permission('p2', PermissionKeys.READ_SITE, '')), new RolePermissionAssignment(new Permission('p3', PermissionKeys.MANAGE_SITES, ''))]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerSiteGateway(io, auth, logger, realtime, siteRepo, userRepo, deptRepo);
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

  it('emits site list when permitted', (done) => {
    siteRepo.findPage.mockResolvedValue({ items: [site], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('site-list-request', { page: 1, limit: 20 });
    });
    client.on('site-list-response', (data: any) => {
      expect(data.items[0].id).toBe('s');
      client.close();
      done();
    });
  });

  it('rejects invalid list parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('site-list-request', { page: 'a' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('emits site get', (done) => {
    siteRepo.findById.mockResolvedValue(site);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('site-get', { id: 's' });
    });
    client.on('site-get-response', (data: any) => {
      expect(data.id).toBe('s');
      client.close();
      done();
    });
  });

  it('broadcasts site-changed on create', (done) => {
    siteRepo.create.mockResolvedValue(site);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('site-create', { id: 's', label: 'Site' });
    });
    client.on('site-create-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('site-changed', { id: 's' });
      client.close();
      done();
    });
  });

  it('broadcasts site-changed on update', (done) => {
    siteRepo.update.mockResolvedValue(site);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('site-update', { id: 's', label: 'Site' });
    });
    client.on('site-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('site-changed', { id: 's' });
      client.close();
      done();
    });
  });

  it('broadcasts site-changed on delete', (done) => {
    siteRepo.delete.mockResolvedValue();
    userRepo.findBySiteId.mockResolvedValue([]);
    deptRepo.findBySiteId.mockResolvedValue([]);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('site-delete', { id: 's' });
    });
    client.on('site-delete-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('site-changed', { id: 's' });
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 't' } });
    client.on('connect', () => {
      client.emit('site-list-request', { page: 1, limit: 20 });
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
      client.emit('site-create', { id: 's', label: 'Site' });
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
      client.emit('site-create', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
