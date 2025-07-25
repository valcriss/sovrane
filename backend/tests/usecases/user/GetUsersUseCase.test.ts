import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetUsersUseCase } from '../../../usecases/user/GetUsersUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetUsersUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetUsersUseCase;
  let user: User;
  let role: Role;
  let permissionChecker: PermissionChecker;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    role = new Role('r', 'Role', [new Permission('p', PermissionKeys.READ_USERS, 'read')]);
    permissionChecker = new PermissionChecker(
      new User(
        'u',
        'John',
        'Doe',
        'j@example.com',
        [role],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
        undefined,
        [],
      ),
    );
    useCase = new GetUsersUseCase(repository, permissionChecker);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', department, site);
  });

  it('should return users from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([user]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('should throw when permission denied', async () => {
    const deniedChecker = mockDeep<PermissionChecker>();
    deniedChecker.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new GetUsersUseCase(repository, deniedChecker);
    await expect(useCase.execute({ page: 1, limit: 20 })).rejects.toThrow('Forbidden');
    expect(repository.findPage).not.toHaveBeenCalled();
  });
});
