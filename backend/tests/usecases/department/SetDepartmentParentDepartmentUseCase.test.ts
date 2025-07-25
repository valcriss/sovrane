import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SetDepartmentParentDepartmentUseCase } from '../../../usecases/department/SetDepartmentParentDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('SetDepartmentParentDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: SetDepartmentParentDepartmentUseCase;
  let department: Department;
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
        [new Role('admin', 'Admin', [new Permission('p', PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY, '')])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new SetDepartmentParentDepartmentUseCase(repository, checker);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
  });

  it('should set parent department', async () => {
    repository.findById.mockResolvedValue(department);
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute('dept-1', 'parent-1');

    expect(result).toBe(department);
    expect(department.parentDepartmentId).toBe('parent-1');
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should return null when department not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', 'parent');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
