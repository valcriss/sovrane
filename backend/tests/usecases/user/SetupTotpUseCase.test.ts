import { mockDeep } from 'jest-mock-extended';
import { SetupTotpUseCase } from '../../../usecases/user/SetupTotpUseCase';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('SetupTotpUseCase', () => {
  let mfa: ReturnType<typeof mockDeep<MfaServicePort>>;
  let useCase: SetupTotpUseCase;
  let checker: PermissionChecker;
  let user: User;

  beforeEach(() => {
    mfa = mockDeep<MfaServicePort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role', [new RolePermissionAssignment(new Permission('p', PermissionKeys.MANAGE_MFA, 'mfa'))]);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    checker = new PermissionChecker(user);
    useCase = new SetupTotpUseCase(mfa, checker);
  });

  it('should generate totp secret', async () => {
    mfa.generateTotpSecret.mockResolvedValue('secret');
    await expect(useCase.execute(user)).resolves.toBe('secret');
    expect(mfa.generateTotpSecret).toHaveBeenCalledWith(user);
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => {
      throw new Error('Forbidden');
    });
    useCase = new SetupTotpUseCase(mfa, denied);
    await expect(useCase.execute(user)).rejects.toThrow('Forbidden');
    expect(mfa.generateTotpSecret).not.toHaveBeenCalled();
  });
});
