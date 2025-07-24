import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateUserGroupUseCase } from '../../usecases/userGroup/CreateUserGroupUseCase';
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../domain/entities/UserGroup';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';

describe('CreateUserGroupUseCase', () => {
  let repo: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: CreateUserGroupUseCase;
  let group: UserGroup;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserGroupRepositoryPort>();
    useCase = new CreateUserGroupUseCase(repo);
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should create group via repository', async () => {
    repo.create.mockResolvedValue(group);
    const result = await useCase.execute(group);
    expect(result).toBe(group);
    expect(repo.create).toHaveBeenCalledWith(group);
  });
});
