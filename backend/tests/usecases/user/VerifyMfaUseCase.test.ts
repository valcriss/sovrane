import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { VerifyMfaUseCase } from '../../../usecases/user/VerifyMfaUseCase';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('VerifyMfaUseCase', () => {
  let mfa: DeepMockProxy<MfaServicePort>;
  let token: DeepMockProxy<TokenServicePort>;
  let repo: DeepMockProxy<UserRepositoryPort>;
  let useCase: VerifyMfaUseCase;
  let user: User;

  beforeEach(() => {
    mfa = mockDeep<MfaServicePort>();
    token = mockDeep<TokenServicePort>();
    repo = mockDeep<UserRepositoryPort>();
    useCase = new VerifyMfaUseCase(mfa, token, repo);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    user.mfaEnabled = true;
  });

  it('should verify totp and issue tokens', async () => {
    user.mfaType = 'totp';
    mfa.verifyTotp.mockResolvedValue(true);
    token.generateAccessToken.mockReturnValue('t');
    token.generateRefreshToken.mockResolvedValue('r');
    repo.update.mockResolvedValue(user);

    const result = await useCase.execute(user, '123', 'ip', 'agent');

    expect(result).toEqual({ user, token: 't', refreshToken: 'r' });
    expect(mfa.verifyTotp).toHaveBeenCalledWith(user, '123');
    expect(repo.update).toHaveBeenCalledWith(user);
  });

  it('should verify email otp', async () => {
    user.mfaType = 'email';
    mfa.verifyEmailOtp.mockResolvedValue(true);
    token.generateAccessToken.mockReturnValue('t');
    token.generateRefreshToken.mockResolvedValue('r');
    repo.update.mockResolvedValue(user);

    const result = await useCase.execute(user, '111');

    expect(result).toEqual({ user, token: 't', refreshToken: 'r' });
    expect(mfa.verifyEmailOtp).toHaveBeenCalledWith(user, '111');
  });

  it('should throw on invalid code', async () => {
    user.mfaType = 'totp';
    mfa.verifyTotp.mockResolvedValue(false);
    await expect(useCase.execute(user, 'bad')).rejects.toThrow('Invalid MFA code');
  });

  it('should throw when mfa type missing', async () => {
    user.mfaType = null;
    await expect(useCase.execute(user, 'x')).rejects.toThrow('MFA not enabled');
  });
});
