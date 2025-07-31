import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateUserGroupUseCase } from '../../../usecases/group/UpdateUserGroupUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('UpdateUserGroupUseCase', () => {
  let repo: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: UpdateUserGroupUseCase;
  let group: UserGroup;
  let user: User;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repo = mockDeep<UserGroupRepositoryPort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role', [new RolePermissionAssignment(new Permission('p', PermissionKeys.UPDATE_GROUP, 'update'))]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    permissionChecker = new PermissionChecker(user);
    useCase = new UpdateUserGroupUseCase(repo, permissionChecker);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should update group via repository', async () => {
    repo.update.mockResolvedValue(group);

    const result = await useCase.execute(group);

    expect(result).toBe(group);
    expect(repo.update).toHaveBeenCalledWith(group);
  });
});
