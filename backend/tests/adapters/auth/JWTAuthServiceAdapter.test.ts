import jwt from 'jsonwebtoken';
import { JWTAuthServiceAdapter } from '../../../adapters/auth/JWTAuthServiceAdapter';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('JWTAuthServiceAdapter', () => {
  const secret = 'secret';
  let repo: DeepMockProxy<UserRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let adapter: JWTAuthServiceAdapter;
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
    adapter = new JWTAuthServiceAdapter(secret, repo, logger);
  });

  it('should verify token and return user', async () => {
    const token = jwt.sign({}, secret, { subject: 'u' });
    repo.findById.mockResolvedValue(user);

    const result = await adapter.verifyToken(token);

    expect(result).toBe(user);
    expect(repo.findById).toHaveBeenCalledWith('u');
  });

  it('should authenticate by email', async () => {
    repo.findByEmail.mockResolvedValue(user);
    const result = await adapter.authenticate('john@example.com', 'p');
    expect(result).toBe(user);
    expect(repo.findByEmail).toHaveBeenCalledWith('john@example.com');
  });

  it('should fail authentication with invalid credentials', async () => {
    repo.findByEmail.mockResolvedValue(null);
    await expect(adapter.authenticate('bad', 'p')).rejects.toThrow('Invalid credentials');
  });

  it('should throw on missing user', async () => {
    const token = jwt.sign({}, secret, { subject: 'u' });
    repo.findById.mockResolvedValue(null);

    await expect(adapter.verifyToken(token)).rejects.toThrow('Invalid token');
  });

  it('should reject unsupported operations', async () => {
    await expect(adapter.authenticateWithProvider('google', 't')).rejects.toThrow('Not supported');
    await expect(adapter.requestPasswordReset('e')).rejects.toThrow('Not implemented');
    await expect(adapter.resetPassword('t', 'p')).rejects.toThrow('Not implemented');
  });
});
