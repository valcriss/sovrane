import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetCurrentUserProfileUseCase } from '../../../usecases/user/GetCurrentUserProfileUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetCurrentUserProfileUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetCurrentUserProfileUseCase;
  let user: User;
  let role: Role;
  let checker: PermissionChecker;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new Permission('p', PermissionKeys.READ_USER, '')])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new GetCurrentUserProfileUseCase(repository, checker);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should get current user profile via repository', async () => {
    repository.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1');

    expect(result).toBe(user);
    expect(repository.findById).toHaveBeenCalledWith('user-1');
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new GetCurrentUserProfileUseCase(repository, denied);
    await expect(useCase.execute('user-1')).rejects.toThrow('Forbidden');
    expect(repository.findById).not.toHaveBeenCalled();
  });
});
