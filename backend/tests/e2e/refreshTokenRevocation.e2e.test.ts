import { JWTTokenServiceAdapter } from '../../adapters/token/JWTTokenServiceAdapter';
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { AuditPort } from '../../domain/ports/AuditPort';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { RotateRefreshTokenUseCase } from '../../usecases/user/RotateRefreshTokenUseCase';
import { InvalidRefreshTokenException } from '../../domain/errors/InvalidRefreshTokenException';
import { mockDeep } from 'jest-mock-extended';
import argon2 from 'argon2';

class InMemoryRefreshTokenRepository implements RefreshTokenPort {
  private tokens = new Map<string, RefreshToken>();

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async findValidByToken(token: string): Promise<RefreshToken | null> {
    for (const t of this.tokens.values()) {
      if (
        !t.revokedAt &&
        !t.usedAt &&
        t.expiresAt > new Date() &&
        (await argon2.verify(t.tokenHash, token))
      ) {
        return t;
      }
    }
    return null;
  }

  async markAsUsed(id: string, replacedBy?: string): Promise<void> {
    const t = this.tokens.get(id);
    if (t) {
      t.usedAt = new Date();
      if (replacedBy) t.replacedBy = replacedBy;
    }
  }

  async revoke(id: string): Promise<void> {
    const t = this.tokens.get(id);
    if (t) t.revokedAt = new Date();
  }

  async revokeAll(userId: string): Promise<void> {
    for (const t of this.tokens.values()) {
      if (t.userId === userId) {
        t.revokedAt = new Date();
      }
    }
  }
}

class InMemoryUserRepository implements UserRepositoryPort {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async findPage(): Promise<{ items: User[]; page: number; limit: number; total: number }> {
    const items = Array.from(this.users.values());
    return { items, page: 1, limit: items.length, total: items.length };
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const u of this.users.values()) if (u.email === email) return u;
    return null;
  }

  async findByExternalAuth(): Promise<User | null> { return null; }
  async findByDepartmentId(): Promise<User[]> { return []; }
  async findByRoleId(): Promise<User[]> { return []; }
  async findBySiteId(): Promise<User[]> { return []; }
  async findUsersWithPasswordChangedBefore(): Promise<User[]> { return []; }

  async create(user: User): Promise<User> { this.users.set(user.id, user); return user; }
  async update(user: User): Promise<User> { this.users.set(user.id, user); return user; }
  async delete(id: string): Promise<void> { this.users.delete(id); }
}

describe('Refresh token revocation (e2e)', () => {
  it('should reject reuse of a used token', async () => {
    const refreshRepo = new InMemoryRefreshTokenRepository();
    const logger = mockDeep<LoggerPort>();
    const audit = mockDeep<AuditPort>();
    const tokenService = new JWTTokenServiceAdapter('secret', refreshRepo, logger, '15m', '30s');
    const userRepo = new InMemoryUserRepository();

    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    await userRepo.create(user);

    const refresh = await tokenService.generateRefreshToken(user, 'ip', 'agent');

    const useCase = new RotateRefreshTokenUseCase(refreshRepo, tokenService, userRepo, audit);
    await useCase.execute(refresh, 'ip', 'agent');

    await expect(useCase.execute(refresh, 'ip', 'agent')).rejects.toBeInstanceOf(InvalidRefreshTokenException);
  });
});
