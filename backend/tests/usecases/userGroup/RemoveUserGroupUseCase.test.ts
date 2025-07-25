import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveUserGroupUseCase } from '../../../usecases/userGroup/RemoveUserGroupUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Role } from '../../../domain/entities/Role';
import { User } from '../../../domain/entities/User';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RemoveUserGroupUseCase', () => {
  let repo: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: RemoveUserGroupUseCase;
  let checker: PermissionChecker;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserGroupRepositoryPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    user = new User(
      'actor',
      'Act',
      'Or',
      'a@b.c',
      [role],
      'active',
      dept,
      site,
      undefined,
      [new Permission('p', PermissionKeys.DELETE_GROUP, '')],
    );
    checker = new PermissionChecker(user);
    useCase = new RemoveUserGroupUseCase(repo, checker);
  });

  it('should delete group via repository', async () => {
    await useCase.execute('g');

    expect(repo.delete).toHaveBeenCalledWith('g');
  });
});
