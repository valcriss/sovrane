import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetUserGroupsUseCase } from '../../../usecases/group/GetUserGroupsUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetUserGroupsUseCase', () => {
  let repository: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: GetUserGroupsUseCase;
  let group: UserGroup;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<UserGroupRepositoryPort>();
    role = new Role('r', 'Role', [new Permission('p', PermissionKeys.READ_GROUPS, 'read')]);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    permissionChecker = new PermissionChecker(user);
    useCase = new GetUserGroupsUseCase(repository, permissionChecker);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should return groups from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [group], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([group]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
