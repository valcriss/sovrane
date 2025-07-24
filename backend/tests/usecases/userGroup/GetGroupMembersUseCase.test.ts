import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetGroupMembersUseCase } from '../../../usecases/userGroup/GetGroupMembersUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { UserGroup } from '../../../domain/entities/UserGroup';

describe('GetGroupMembersUseCase', () => {
  let repository: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: GetGroupMembersUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach(() => {
    repository = mockDeep<UserGroupRepositoryPort>();
    useCase = new GetGroupMembersUseCase(repository);
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should return members from repository', async () => {
    repository.listMembers.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute('g', { page: 1, limit: 20 });

    expect(result.items).toEqual([user]);
    expect(repository.listMembers).toHaveBeenCalledWith('g', { page: 1, limit: 20 });
  });
});
