import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetUserUseCase } from '../../../usecases/user/GetUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetUserUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetUserUseCase;
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
    useCase = new GetUserUseCase(repository, checker);
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', department, site);
  });

  it('should return user by id', async () => {
    repository.findById.mockResolvedValue(user);

    const result = await useCase.execute('u');

    expect(result).toBe(user);
    expect(repository.findById).toHaveBeenCalledWith('u');
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new GetUserUseCase(repository, denied);
    await expect(useCase.execute('u')).rejects.toThrow('Forbidden');
    expect(repository.findById).not.toHaveBeenCalled();
  });
});
