import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerConfigGateway } from '../../../../adapters/controllers/websocket/configGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { GetConfigUseCase } from '../../../../usecases/config/GetConfigUseCase';
import { UpdateConfigUseCase } from '../../../../usecases/config/UpdateConfigUseCase';
import { DeleteConfigUseCase } from '../../../../usecases/config/DeleteConfigUseCase';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Config WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let getUseCase: DeepMockProxy<GetConfigUseCase>;
  let updateUseCase: DeepMockProxy<UpdateConfigUseCase>;
  let deleteUseCase: DeepMockProxy<DeleteConfigUseCase>;
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
    getUseCase = mockDeep<GetConfigUseCase>();
    updateUseCase = mockDeep<UpdateConfigUseCase>();
    deleteUseCase = mockDeep<DeleteConfigUseCase>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.READ_CONFIG, ''),
      new Permission('p2', PermissionKeys.UPDATE_CONFIG, ''),
      new Permission('p3', PermissionKeys.DELETE_CONFIG, ''),
    ]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerConfigGateway(
      io,
      auth,
      logger,
      realtime,
      getUseCase,
      updateUseCase,
      deleteUseCase,
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

  it('emits configuration value when permitted', (done) => {
    getUseCase.execute.mockResolvedValue('v');
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-get', { key: 'k' });
    });
    client.on('config-get-response', (data: any) => {
      expect(data).toEqual({ key: 'k', value: 'v' });
      client.close();
      done();
    });
  });

  it('rejects invalid get parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-get', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('broadcasts config-changed on update', (done) => {
    updateUseCase.execute.mockResolvedValue();
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-update', { key: 'k', value: 'v', updatedBy: 'u' });
    });
    client.on('config-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('config-changed', { key: 'k' });
      client.close();
      done();
    });
  });

  it('broadcasts config-changed on delete', (done) => {
    deleteUseCase.execute.mockResolvedValue();
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-delete', { key: 'k', deletedBy: 'u' });
    });
    client.on('config-delete-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('config-changed', { key: 'k' });
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-get', { key: 'k' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Forbidden');
      client.close();
      done();
    });
  });

  it('rejects update when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-update', { key: 'k', value: 'v', updatedBy: 'u' });
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
      client.emit('config-update', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('rejects invalid delete payload', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('config-delete', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
