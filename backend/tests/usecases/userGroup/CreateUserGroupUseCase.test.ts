import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateUserGroupUseCase } from '../../../usecases/userGroup/CreateUserGroupUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('CreateUserGroupUseCase', () => {
  let repo: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: CreateUserGroupUseCase;
  let group: UserGroup;
  let user: User;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repo = mockDeep<UserGroupRepositoryPort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role', [new Permission('p', PermissionKeys.CREATE_GROUP, 'create')]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    permissionChecker = new PermissionChecker(user);
    useCase = new CreateUserGroupUseCase(repo, permissionChecker);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should create group via repository', async () => {
    repo.create.mockResolvedValue(group);
    const result = await useCase.execute(group);
    expect(result).toBe(group);
    expect(repo.create).toHaveBeenCalledWith(group);
  });
});
