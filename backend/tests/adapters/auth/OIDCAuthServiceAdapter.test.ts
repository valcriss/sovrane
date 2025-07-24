import jwt from 'jsonwebtoken';
import { OIDCAuthServiceAdapter } from '../../../adapters/auth/OIDCAuthServiceAdapter';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

const secret = 'oidc-secret';

describe('OIDCAuthServiceAdapter', () => {
  let repo: DeepMockProxy<UserRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let adapter: OIDCAuthServiceAdapter;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    adapter = new OIDCAuthServiceAdapter(secret, 'issuer', repo, logger);
  });

  it('should verify token with issuer', async () => {
    const token = jwt.sign({}, secret, { algorithm: 'HS256', issuer: 'issuer', subject: 'u' });
    repo.findById.mockResolvedValue(user);

    const result = await adapter.verifyToken(token);

    expect(result).toBe(user);
    expect(repo.findById).toHaveBeenCalledWith('u');
  });

  it('should throw on invalid issuer', async () => {
    const token = jwt.sign({}, secret, { algorithm: 'HS256', issuer: 'other', subject: 'u' });
    await expect(adapter.verifyToken(token)).rejects.toThrow();
  });

  it('should throw when user not found', async () => {
    const token = jwt.sign({}, secret, { algorithm: 'HS256', issuer: 'issuer', subject: 'u' });
    repo.findById.mockResolvedValue(null);
    await expect(adapter.verifyToken(token)).rejects.toThrow('Invalid token');
  });

  it('should reject suspended or archived users', async () => {
    const token = jwt.sign({}, secret, { algorithm: 'HS256', issuer: 'issuer', subject: 'u' });
    repo.findById.mockResolvedValue(user);
    user.status = 'suspended';
    await expect(adapter.verifyToken(token)).rejects.toThrow(
      'User account is suspended or archived',
    );
    user.status = 'archived';
    await expect(adapter.verifyToken(token)).rejects.toThrow(
      'User account is suspended or archived',
    );
  });

  it('should delegate authenticateWithProvider', async () => {
    const token = jwt.sign({}, secret, { algorithm: 'HS256', issuer: 'issuer', subject: 'u' });
    repo.findById.mockResolvedValue(user);
    const result = await adapter.authenticateWithProvider('google', token);
    expect(result).toBe(user);
  });

  it('should reject unsupported operations', async () => {
    await expect(adapter.authenticate('e', 'p')).rejects.toThrow('Not supported');
    await expect(adapter.requestPasswordReset('e')).rejects.toThrow('Not implemented');
    await expect(adapter.resetPassword('t', 'p')).rejects.toThrow('Not implemented');
  });
});
