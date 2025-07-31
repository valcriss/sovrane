import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerGroupGateway } from '../../../../adapters/controllers/websocket/groupGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { UserGroupRepositoryPort } from '../../../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { UserGroup } from '../../../../domain/entities/UserGroup';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Group WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let groupRepo: DeepMockProxy<UserGroupRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    groupRepo = mockDeep<UserGroupRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [new RolePermissionAssignment(new Permission('p1', PermissionKeys.READ_GROUPS, '')), new RolePermissionAssignment(new Permission('p2', PermissionKeys.CREATE_GROUP, '')), new RolePermissionAssignment(new Permission('p3', PermissionKeys.UPDATE_GROUP, '')), new RolePermissionAssignment(new Permission('p4', PermissionKeys.DELETE_GROUP, '')), new RolePermissionAssignment(new Permission('p5', PermissionKeys.MANAGE_GROUP_MEMBERS, '')), new RolePermissionAssignment(new Permission('p6', PermissionKeys.MANAGE_GROUP_RESPONSIBLES, '')), new RolePermissionAssignment(new Permission('p7', PermissionKeys.READ_GROUP, ''))]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', [user], [user]);
    auth.verifyToken.mockResolvedValue(user);
    registerGroupGateway(io, auth, logger, realtime, groupRepo, userRepo);
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

  it('emits group list when permitted', (done) => {
    groupRepo.findPage.mockResolvedValue({ items: [group], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-list-request', { page: 1, limit: 20 });
    });
    client.on('group-list-response', (data: any) => {
      expect(data.items[0].id).toBe('g');
      client.close();
      done();
    });
  });

  it('emits group get', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-get', { id: 'g' });
    });
    client.on('group-get-response', (data: any) => {
      expect(data.id).toBe('g');
      client.close();
      done();
    });
  });

  it('emits group members', (done) => {
    groupRepo.listMembers.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-members-request', { id: 'g', page: 1, limit: 20 });
    });
    client.on('group-members-response', (data: any) => {
      expect(data.items[0].id).toBe('u');
      client.close();
      done();
    });
  });

  it('emits group responsibles', (done) => {
    groupRepo.listResponsibles.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-responsibles-request', { id: 'g', page: 1, limit: 20 });
    });
    client.on('group-responsibles-response', (data: any) => {
      expect(data.items[0].id).toBe('u');
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on create', (done) => {
    groupRepo.create.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-create', { id: 'g', name: 'Group' });
    });
    client.on('group-create-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on update', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    groupRepo.update.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-update', { id: 'g', name: 'Group' });
    });
    client.on('group-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on delete', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-delete', { id: 'g' });
    });
    client.on('group-delete-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on add user', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(user);
    groupRepo.addUser.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-add-user', { groupId: 'g', userId: 'u2' });
    });
    client.on('group-add-user-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on remove user', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(user);
    groupRepo.removeUser.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-remove-user', { groupId: 'g', userId: 'u2' });
    });
    client.on('group-remove-user-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on add responsible', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(user);
    groupRepo.addResponsible.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-add-responsible', { groupId: 'g', userId: 'u2' });
    });
    client.on('group-add-responsible-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });

  it('broadcasts group-changed on remove responsible', (done) => {
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(user);
    groupRepo.removeResponsible.mockResolvedValue(group);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('group-remove-responsible', { groupId: 'g', userId: 'u2' });
    });
    client.on('group-remove-responsible-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('group-changed', { id: 'g' });
      client.close();
      done();
    });
  });
});
