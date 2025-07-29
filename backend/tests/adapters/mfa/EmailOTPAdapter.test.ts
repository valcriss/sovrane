import { EmailOTPAdapter } from '../../../adapters/mfa/EmailOTPAdapter';
import { InMemoryCacheAdapter } from '../../../adapters/cache/InMemoryCacheAdapter';
import { NodemailerEmailServiceAdapter } from '../../../adapters/email/NodemailerEmailServiceAdapter';
import { mockDeep } from 'jest-mock-extended';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('EmailOTPAdapter', () => {
  let cache: InMemoryCacheAdapter;
  let mailer: ReturnType<typeof mockDeep<NodemailerEmailServiceAdapter>>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let adapter: EmailOTPAdapter;
  let user: User;

  beforeEach(() => {
    cache = new InMemoryCacheAdapter();
    mailer = mockDeep<NodemailerEmailServiceAdapter>();
    logger = mockDeep<LoggerPort>();
    adapter = new EmailOTPAdapter(cache, mailer, logger, 5);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should send and verify code', async () => {
    const code = await adapter.generateEmailOtp(user);
    expect(await cache.get(`mfa:email:${user.id}`)).toBe(code);
    expect(mailer.sendMail).toHaveBeenCalled();
    expect(await adapter.verifyEmailOtp(user, code)).toBe(true);
    expect(await cache.get(`mfa:email:${user.id}`)).toBeNull();
  });

  it('should fail verification on wrong code or expired', async () => {
    const code = await adapter.generateEmailOtp(user);
    expect(await adapter.verifyEmailOtp(user, '111111')).toBe(false);
    jest.advanceTimersByTime(6000);
    expect(await adapter.verifyEmailOtp(user, code)).toBe(false);
  });

  it('should clear code on disable', async () => {
    await adapter.generateEmailOtp(user);
    await adapter.disableMfa(user);
    expect(await cache.get(`mfa:email:${user.id}`)).toBeNull();
  });

  it('should throw on totp operations', async () => {
    await expect(adapter.generateTotpSecret(user)).rejects.toThrow('Not supported');
    await expect(adapter.verifyTotp(user, '1')).rejects.toThrow('Not supported');
  });
});
