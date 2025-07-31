import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveDepartmentUserUseCase } from '../../../usecases/department/RemoveDepartmentUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('RemoveDepartmentUserUseCase', () => {
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: RemoveDepartmentUserUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;
  let checker: PermissionChecker;

  beforeEach(() => {
    userRepo = mockDeep<UserRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [
          new Role(
            'admin',
            'Admin',
            [
              new RolePermissionAssignment(
                new Permission('p', PermissionKeys.MANAGE_DEPARTMENT_USERS, ''),
              ),
            ],
          ),
        ],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new RemoveDepartmentUserUseCase(userRepo, checker);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    role = new Role('role-1', 'Admin');
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should remove user from department', async () => {
    userRepo.findById.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);

    const result = await useCase.execute('user-1');

    expect(result).toBe(user);
    expect(user.department).toBeNull();
    expect(userRepo.update).toHaveBeenCalledWith(user);
  });

  it('should return null when user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
