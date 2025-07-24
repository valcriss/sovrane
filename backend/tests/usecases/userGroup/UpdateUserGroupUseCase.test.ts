import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateUserGroupUseCase } from '../../../usecases/userGroup/UpdateUserGroupUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('UpdateUserGroupUseCase', () => {
  let repo: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: UpdateUserGroupUseCase;
  let group: UserGroup;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserGroupRepositoryPort>();
    useCase = new UpdateUserGroupUseCase(repo);
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should update group via repository', async () => {
    repo.update.mockResolvedValue(group);

    const result = await useCase.execute(group);

    expect(result).toBe(group);
    expect(repo.update).toHaveBeenCalledWith(group);
  });
});
