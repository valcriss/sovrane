import { createServer } from 'http';
import { Server } from 'socket.io';
import * as ioClient from 'socket.io-client';
import { registerUserGateway } from '../../../../adapters/controllers/websocket/userGateway';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';

describe('User WebSocket gateway', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let url: string;
  let auth: DeepMockProxy<AuthServicePort>;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    auth = mockDeep<AuthServicePort>();
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    auth.verifyToken.mockResolvedValue(user);
    registerUserGateway(io, auth);
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
});
