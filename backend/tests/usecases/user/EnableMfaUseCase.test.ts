import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { EnableMfaUseCase } from '../../../usecases/user/EnableMfaUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('EnableMfaUseCase', () => {
  let repo: DeepMockProxy<UserRepositoryPort>;
  let refresh: DeepMockProxy<RefreshTokenPort>;
  let useCase: EnableMfaUseCase;
  let checker: PermissionChecker;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    refresh = mockDeep<RefreshTokenPort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role', [
      new Permission('p', PermissionKeys.MANAGE_MFA, 'mfa'),
    ]);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    checker = new PermissionChecker(user);
    useCase = new EnableMfaUseCase(repo, refresh, checker);
  });

  it('should enable mfa', async () => {
    repo.update.mockResolvedValue(user);
    await expect(useCase.execute(user, 'email', ['1'])).resolves.toBe(user);
    expect(user.mfaEnabled).toBe(true);
    expect(user.mfaType).toBe('email');
    expect(user.mfaRecoveryCodes).toEqual(['1']);
    expect(repo.update).toHaveBeenCalledWith(user);
    expect(refresh.revokeAll).toHaveBeenCalledWith(user.id);
  });

  it('should use default recovery codes when none provided', async () => {
    repo.update.mockResolvedValue(user);
    await expect(useCase.execute(user, 'totp')).resolves.toBe(user);
    expect(user.mfaRecoveryCodes).toEqual([]);
    expect(repo.update).toHaveBeenCalledWith(user);
    expect(refresh.revokeAll).toHaveBeenCalledWith(user.id);
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => {
      throw new Error('Forbidden');
    });
    useCase = new EnableMfaUseCase(repo, refresh, denied);
    await expect(useCase.execute(user, 'totp')).rejects.toThrow('Forbidden');
    expect(repo.update).not.toHaveBeenCalled();
    expect(refresh.revokeAll).not.toHaveBeenCalled();
  });
});
