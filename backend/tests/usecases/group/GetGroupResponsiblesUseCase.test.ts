import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetGroupResponsiblesUseCase } from '../../../usecases/group/GetGroupResponsiblesUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';

describe('GetGroupResponsiblesUseCase', () => {
  let repository: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: GetGroupResponsiblesUseCase;
  let checker: PermissionChecker;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach(() => {
    repository = mockDeep<UserGroupRepositoryPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    const actor = new User(
      'actor',
      'Act',
      'Or',
      'a@b.c',
      [role],
      'active',
      dept,
      site,
      undefined,
      [new Permission('p', PermissionKeys.READ_GROUP, '')],
    );
    checker = new PermissionChecker(actor);
    useCase = new GetGroupResponsiblesUseCase(repository, checker);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should return responsibles from repository', async () => {
    repository.listResponsibles.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute('g', { page: 1, limit: 20 });

    expect(result.items).toEqual([user]);
    expect(repository.listResponsibles).toHaveBeenCalledWith('g', { page: 1, limit: 20 });
  });
});
