import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerUserGateway } from '../../../../adapters/controllers/websocket/userGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../../domain/ports/AuditPort';
import { TokenServicePort } from '../../../../domain/ports/TokenServicePort';
import { RefreshTokenPort } from '../../../../domain/ports/RefreshTokenPort';
import { GetConfigUseCase } from '../../../../usecases/config/GetConfigUseCase';
import { PasswordValidator } from '../../../../domain/services/PasswordValidator';
import { MfaServicePort } from '../../../../domain/ports/MfaServicePort';
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
  let tokenService: DeepMockProxy<TokenServicePort>;
  let refreshRepo: DeepMockProxy<RefreshTokenPort>;
  let getConfig: DeepMockProxy<GetConfigUseCase>;
  let passwordValidator: DeepMockProxy<PasswordValidator>;
  let mfaService: DeepMockProxy<MfaServicePort>;
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
    tokenService = mockDeep<TokenServicePort>();
    refreshRepo = mockDeep<RefreshTokenPort>();
    getConfig = mockDeep<GetConfigUseCase>();
    passwordValidator = mockDeep<PasswordValidator>();
    mfaService = mockDeep<MfaServicePort>();
    passwordValidator.validate.mockResolvedValue();
    tokenService.generateAccessToken.mockReturnValue('t');
    tokenService.generateRefreshToken.mockResolvedValue('r');
    auth.authenticate.mockResolvedValue(user);
    auth.requestPasswordReset.mockResolvedValue();
    auth.resetPassword.mockResolvedValue();
    mfaService.generateTotpSecret.mockResolvedValue('sec');
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.READ_USERS, ''),
      new Permission('p2', PermissionKeys.UPDATE_USER, ''),
      new Permission('p3', PermissionKeys.READ_USER, ''),
      new Permission('p4', PermissionKeys.MANAGE_MFA, ''),
    ]);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerUserGateway(
      io,
      auth,
      logger,
      realtime,
      userRepo,
      audit,
      tokenService,
      refreshRepo,
      getConfig,
      passwordValidator,
      mfaService,
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

  it('emits user data on get', (done) => {
    userRepo.findById.mockResolvedValue(user);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-get', { id: 'u' });
    });
    client.on('user-get-response', (data: any) => {
      expect(data.id).toBe('u');
      client.close();
      done();
    });
  });

  it('broadcasts user-changed on create', (done) => {
    userRepo.create.mockResolvedValue(user);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('user-create', {
        id: 'u',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'secret',
        department: { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
      });
    });
    client.on('user-create-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('user-changed', { id: 'u' });
      client.close();
      done();
    });
  });

  it('responds on login', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('auth-login', { email: 'john@example.com', password: 'secret' });
    });
    client.on('auth-login-response', (data: any) => {
      expect(data.token).toBe('t');
      client.close();
      done();
    });
  });

  it('handles password reset workflow', (done) => {
    auth.verifyToken.mockResolvedValue(user);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('auth-reset', { token: 'tok', password: 'new' });
    });
    client.on('auth-reset-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('user-changed', { id: 'u' });
      client.close();
      done();
    });
  });

  it('handles mfa enable/disable', (done) => {
    userRepo.update.mockResolvedValue(user);
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('auth-mfa-enable', { type: 'email' });
    });
    client.on('auth-mfa-enable-response', () => {
      client.emit('auth-mfa-disable');
    });
    client.on('auth-mfa-disable-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('user-changed', { id: 'u' });
      client.close();
      done();
    });
  });
});
