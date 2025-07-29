import { TOTPAdapter } from '../../../adapters/mfa/TOTPAdapter';
import { mockDeep } from 'jest-mock-extended';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import * as speakeasy from 'speakeasy';

describe('TOTPAdapter', () => {
  const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'.slice(0, 64);
  let repo: ReturnType<typeof mockDeep<UserRepositoryPort>>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let adapter: TOTPAdapter;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    adapter = new TOTPAdapter(repo, logger, key);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
  });

  it('should generate and verify totp', async () => {
    const secret = await adapter.generateTotpSecret(user);
    expect(user.mfaSecret).not.toBe(secret);
    const token = speakeasy.totp({ secret, encoding: 'base32' });
    expect(await adapter.verifyTotp(user, token)).toBe(true);
    expect(repo.update).toHaveBeenCalled();
  });

  it('should disable mfa', async () => {
    await adapter.generateTotpSecret(user);
    await adapter.disableMfa(user);
    expect(user.mfaEnabled).toBe(false);
    expect(user.mfaSecret).toBeNull();
    expect(repo.update).toHaveBeenCalledTimes(2);
  });

  it('should return false when no secret', async () => {
    expect(await adapter.verifyTotp(user, '123')).toBe(false);
  });

  it('should return false on wrong token', async () => {
    await adapter.generateTotpSecret(user);
    expect(await adapter.verifyTotp(user, '000000')).toBe(false);
  });

  it('should throw on email otp operations', async () => {
    await expect(adapter.generateEmailOtp(user)).rejects.toThrow('Not supported');
    await expect(adapter.verifyEmailOtp(user, '1')).rejects.toThrow('Not supported');
  });
});
