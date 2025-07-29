import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

class MockMfaService implements MfaServicePort {
  private totp = new Map<string, string>();
  private email = new Map<string, string>();

  async generateTotpSecret(user: User): Promise<string> {
    const secret = `totp-${user.id}`;
    this.totp.set(user.id, secret);
    return secret;
  }

  async verifyTotp(user: User, token: string): Promise<boolean> {
    return this.totp.get(user.id) === token;
  }

  async generateEmailOtp(user: User): Promise<string> {
    const otp = `code-${user.id}`;
    this.email.set(user.id, otp);
    return otp;
  }

  async verifyEmailOtp(user: User, otp: string): Promise<boolean> {
    const match = this.email.get(user.id) === otp;
    if (match) {
      this.email.delete(user.id);
    }
    return match;
  }

  async disableMfa(user: User): Promise<void> {
    this.totp.delete(user.id);
    this.email.delete(user.id);
  }
}

describe('MfaServicePort Interface', () => {
  let service: MockMfaService;
  let user: User;

  beforeEach(() => {
    service = new MockMfaService();
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
  });

  it('should generate and verify totp', async () => {
    const secret = await service.generateTotpSecret(user);
    expect(await service.verifyTotp(user, secret)).toBe(true);
  });

  it('should generate and verify email otp', async () => {
    const code = await service.generateEmailOtp(user);
    expect(await service.verifyEmailOtp(user, code)).toBe(true);
  });

  it('should disable mfa', async () => {
    await service.generateTotpSecret(user);
    await service.generateEmailOtp(user);
    await service.disableMfa(user);
    expect(await service.verifyTotp(user, 'x')).toBe(false);
    expect(await service.verifyEmailOtp(user, 'x')).toBe(false);
  });
});
