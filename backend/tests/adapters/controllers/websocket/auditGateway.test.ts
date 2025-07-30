import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerAuditGateway } from '../../../../adapters/controllers/websocket/auditGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { RealtimePort } from '../../../../domain/ports/RealtimePort';
import { AuditPort } from '../../../../domain/ports/AuditPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { AuditConfigService } from '../../../../domain/services/AuditConfigService';
import { AuditEvent } from '../../../../domain/entities/AuditEvent';
import { AuditConfig } from '../../../../domain/entities/AuditConfig';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';

describe('Audit WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let realtime: DeepMockProxy<RealtimePort>;
  let audit: DeepMockProxy<AuditPort>;
  let config: DeepMockProxy<AuditConfigService>;
  let role: Role;
  let user: User;
  let department: Department;
  let site: Site;
  let event: AuditEvent;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    logger = mockDeep<LoggerPort>();
    realtime = mockDeep<RealtimePort>();
    audit = mockDeep<AuditPort>();
    config = mockDeep<AuditConfigService>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [
      new Permission('p1', PermissionKeys.VIEW_AUDIT_LOGS, ''),
      new Permission('p2', PermissionKeys.WRITE_AUDIT_CONFIG, ''),
    ]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    event = new AuditEvent(new Date('2024-01-01T00:00:00Z'), 'u', 'user', 'test');
    auth.verifyToken.mockResolvedValue(user);
    registerAuditGateway(io, auth, logger, realtime, audit, config);
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

  it('emits audit logs when permitted', (done) => {
    audit.findPaginated.mockResolvedValue({ items: [event], page: 1, limit: 20, total: 1 });
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('audit-log-request', { page: 1, limit: 20 });
    });
    client.on('audit-log-response', (data: any) => {
      expect(data.items[0].action).toBe('test');
      client.close();
      done();
    });
  });

  it('broadcasts audit-config-changed on update', (done) => {
    config.update.mockResolvedValue(new AuditConfig(1, [], [], new Date(), 'u'));
    audit.log.mockResolvedValue();
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('audit-config-update', { levels: [], categories: [], updatedBy: 'u' });
    });
    client.on('audit-config-update-response', () => {
      expect(realtime.broadcast).toHaveBeenCalledWith('audit-config-changed', { updatedBy: 'u' });
      client.close();
      done();
    });
  });

  it('rejects invalid list parameters', (done) => {
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('audit-log-request', { page: 'x' });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });

  it('rejects when permission missing', (done) => {
    auth.verifyToken.mockResolvedValue(new User('x', 'A', 'B', 'a@b.c', [], 'active', department, site));
    const client = ioClient.connect(url, { auth: { token: 'token' } });
    client.on('connect', () => {
      client.emit('audit-log-request', { page: 1, limit: 20 });
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
      client.emit('audit-config-update', { levels: [], categories: [], updatedBy: 'u' });
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
      client.emit('audit-config-update', { bad: true });
    });
    client.on('error', (err: { error: string }) => {
      expect(err.error).toBe('Invalid parameters');
      client.close();
      done();
    });
  });
});
