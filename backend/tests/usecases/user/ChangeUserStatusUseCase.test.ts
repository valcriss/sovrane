import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ChangeUserStatusUseCase } from '../../../usecases/user/ChangeUserStatusUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('ChangeUserStatusUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: ChangeUserStatusUseCase;
  let user: User;
  let role: Role;
  let checker: PermissionChecker;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    const permission = new Permission('p', PermissionKeys.UPDATE_USER, '');
    const rolePermAssignment = new RolePermissionAssignment(permission);
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [rolePermAssignment])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new ChangeUserStatusUseCase(repository, checker);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should change user status via repository', async () => {
    repository.findById.mockResolvedValue(user);
    repository.update.mockResolvedValue(user);

    const result = await useCase.execute('user-1', 'suspended');

    expect(result).toBe(user);
    expect(user.status).toBe('suspended');
    expect(user.updatedBy).toBe(checker.currentUser);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(repository.findById).toHaveBeenCalledWith('user-1');
    expect(repository.update).toHaveBeenCalledWith(user);
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new ChangeUserStatusUseCase(repository, denied);
    await expect(useCase.execute('user-1', 'suspended')).rejects.toThrow('Forbidden');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('should return null when user is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', 'archived');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
