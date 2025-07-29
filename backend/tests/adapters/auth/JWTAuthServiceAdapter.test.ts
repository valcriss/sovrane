import jwt from 'jsonwebtoken';
import { TokenExpiredException } from '../../../domain/errors/TokenExpiredException';
import { JWTAuthServiceAdapter } from '../../../adapters/auth/JWTAuthServiceAdapter';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
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
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    prisma = mockDeep<PrismaClient>();
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    adapter = new JWTAuthServiceAdapter(secret, repo, prisma, logger);
  });

  it('should verify token and return user', async () => {
    const token = jwt.sign({}, secret, { subject: 'u' });
    repo.findById.mockResolvedValue(user);

    const result = await adapter.verifyToken(token);

    expect(result).toBe(user);
    expect(repo.findById).toHaveBeenCalledWith('u');
  });

  it('should authenticate by email', async () => {
    const hash = await argon2.hash('p');
    prisma.user.findUnique.mockResolvedValue({ id: 'u', password: hash } as any);
    repo.findById.mockResolvedValue(user);
    const result = await adapter.authenticate('john@example.com', 'p');
    expect(result).toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'john@example.com' },
      select: { password: true, id: true },
    });
    expect(repo.findById).toHaveBeenCalledWith('u');
  });

  it('should fail authentication with invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(adapter.authenticate('bad', 'p')).rejects.toThrow('Invalid credentials');
  });

  it('should fail when password does not match', async () => {
    const hash = await argon2.hash('other');
    prisma.user.findUnique.mockResolvedValue({ id: 'u', password: hash } as any);
    await expect(adapter.authenticate('john@example.com', 'p')).rejects.toThrow('Invalid credentials');
  });

  it('should reject suspended or archived users when authenticating', async () => {
    const hash = await argon2.hash('p');
    prisma.user.findUnique.mockResolvedValue({ id: 'u', password: hash } as any);
    repo.findById.mockResolvedValue(user);
    user.status = 'suspended';
    await expect(adapter.authenticate('john@example.com', 'p')).rejects.toThrow(
      'User account is suspended or archived',
    );
    user.status = 'archived';
    await expect(adapter.authenticate('john@example.com', 'p')).rejects.toThrow(
      'User account is suspended or archived',
    );
  });

  it('should throw on missing user', async () => {
    const token = jwt.sign({}, secret, { subject: 'u' });
    repo.findById.mockResolvedValue(null);

    await expect(adapter.verifyToken(token)).rejects.toThrow('Invalid token');
  });

  it('should throw TokenExpiredException on expired token', async () => {
    const expired = jwt.sign({}, secret, { subject: 'u', expiresIn: -1 });
    await expect(adapter.verifyToken(expired)).rejects.toBeInstanceOf(
      TokenExpiredException,
    );
  });

  it('should reject suspended or archived users when verifying token', async () => {
    const token = jwt.sign({}, secret, { subject: 'u' });
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

  it('should reject unsupported operations', async () => {
    await expect(adapter.authenticateWithProvider('google', 't')).rejects.toThrow('Not supported');
    await expect(adapter.requestPasswordReset('e')).rejects.toThrow('Not implemented');
    await expect(adapter.resetPassword('t', 'p')).rejects.toThrow('Not implemented');
  });

  it('should fail when user cannot be fetched after password check', async () => {
    const hash = await argon2.hash('p');
    prisma.user.findUnique.mockResolvedValue({ id: 'u', password: hash } as any);
    repo.findById.mockResolvedValue(null);

    await expect(adapter.authenticate('john@example.com', 'p')).rejects.toThrow('Invalid credentials');
  });
});
