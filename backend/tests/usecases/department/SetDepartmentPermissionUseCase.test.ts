import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SetDepartmentPermissionUseCase } from '../../../usecases/department/SetDepartmentPermissionUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('SetDepartmentPermissionUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: SetDepartmentPermissionUseCase;
  let department: Department;
  let permission: Permission;
  let site: Site;
  let checker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new Permission('p', PermissionKeys.MANAGE_DEPARTMENT_PERMISSIONS, '')])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new SetDepartmentPermissionUseCase(repository, checker);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    permission = new Permission('perm-1', 'READ', 'read');
  });

  it('should add permission to department', async () => {
    repository.findById.mockResolvedValue(department);
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute('dept-1', permission);

    expect(result).toBe(department);
    expect(department.permissions).toContain(permission);
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should return null when department not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', permission);

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
