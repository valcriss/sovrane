import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('RemoveDepartmentUseCase', () => {
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: RemoveDepartmentUseCase;
  let department: Department;
  let site: Site;
  let user: User;
  let role: Role;
  let checker: PermissionChecker;

  beforeEach(() => {
    deptRepo = mockDeep<DepartmentRepositoryPort>();
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
                new Permission('p', PermissionKeys.DELETE_DEPARTMENT, ''),
              ),
            ],
          ),
        ],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new RemoveDepartmentUseCase(deptRepo, userRepo, checker);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    role = new Role('role-1', 'Admin');
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should delete a department when no users are attached', async () => {
    userRepo.findByDepartmentId.mockResolvedValue([]);

    await useCase.execute('dept-1');

    expect(deptRepo.delete).toHaveBeenCalledWith('dept-1');
  });

  it('should throw when users are attached to the department', async () => {
    userRepo.findByDepartmentId.mockResolvedValue([user]);

    await expect(useCase.execute('dept-1')).rejects.toThrow('Department has attached users');
    expect(deptRepo.delete).not.toHaveBeenCalled();
  });
});
