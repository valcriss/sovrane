import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveUserUseCase } from '../../../usecases/user/RemoveUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('RemoveUserUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let refreshRepo: DeepMockProxy<RefreshTokenPort>;
  let useCase: RemoveUserUseCase;
  let checker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    refreshRepo = mockDeep<RefreshTokenPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new UserPermissionAssignment(new Permission('p', PermissionKeys.DELETE_USER, ''))])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new RemoveUserUseCase(repository, checker, refreshRepo);
  });

  it('should delete user via repository', async () => {
    await useCase.execute('user-1');

    expect(repository.delete).toHaveBeenCalledWith('user-1');
    expect(refreshRepo.revokeAll).toHaveBeenCalledWith('user-1');
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new RemoveUserUseCase(repository, denied, refreshRepo);
    await expect(useCase.execute('user-1')).rejects.toThrow('Forbidden');
    expect(repository.delete).not.toHaveBeenCalled();
    expect(refreshRepo.revokeAll).not.toHaveBeenCalled();
  });
});
