import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { DisableMfaUseCase } from '../../../usecases/user/DisableMfaUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('DisableMfaUseCase', () => {
  let repo: DeepMockProxy<UserRepositoryPort>;
  let mfa: DeepMockProxy<MfaServicePort>;
  let refresh: DeepMockProxy<RefreshTokenPort>;
  let useCase: DisableMfaUseCase;
  let checker: PermissionChecker;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    mfa = mockDeep<MfaServicePort>();
    refresh = mockDeep<RefreshTokenPort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role', [
      new Permission('p', PermissionKeys.MANAGE_MFA, 'mfa'),
    ]);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    checker = new PermissionChecker(user);
    useCase = new DisableMfaUseCase(repo, mfa, refresh, checker);
    user.mfaEnabled = true;
    user.mfaType = 'email';
    user.mfaSecret = 'x';
    user.mfaRecoveryCodes = ['c'];
  });

  it('should disable mfa', async () => {
    repo.update.mockResolvedValue(user);
    await useCase.execute(user);
    expect(mfa.disableMfa).toHaveBeenCalledWith(user);
    expect(user.mfaEnabled).toBe(false);
    expect(user.mfaType).toBeNull();
    expect(user.mfaSecret).toBeNull();
    expect(user.mfaRecoveryCodes).toEqual([]);
    expect(repo.update).toHaveBeenCalledWith(user);
    expect(refresh.revokeAll).toHaveBeenCalledWith(user.id);
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => {
      throw new Error('Forbidden');
    });
    useCase = new DisableMfaUseCase(repo, mfa, refresh, denied);
    await expect(useCase.execute(user)).rejects.toThrow('Forbidden');
    expect(mfa.disableMfa).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
    expect(refresh.revokeAll).not.toHaveBeenCalled();
  });
});
