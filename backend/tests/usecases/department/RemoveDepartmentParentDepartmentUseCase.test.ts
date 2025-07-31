import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveDepartmentParentDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentParentDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('RemoveDepartmentParentDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveDepartmentParentDepartmentUseCase;
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
        [
          new Role(
            'admin', 'Admin', [new UserPermissionAssignment(new Permission('p', PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY, ''))],
          ),
        ],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new RemoveDepartmentParentDepartmentUseCase(repository, checker);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', 'parent', null, site);
  });

  it('should remove parent department', async () => {
    repository.findById.mockResolvedValue(department);
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute('dept-1');

    expect(result).toBe(department);
    expect(department.parentDepartmentId).toBeNull();
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should return null when department not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
