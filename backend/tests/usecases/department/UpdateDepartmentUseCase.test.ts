import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateDepartmentUseCase } from '../../../usecases/department/UpdateDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('UpdateDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: UpdateDepartmentUseCase;
  let department: Department;
  let site: Site;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    const role = new Role(
      'r',
      'Role',
      [new RolePermissionAssignment(new Permission('p', PermissionKeys.UPDATE_DEPARTMENT, 'update'))],
    );
    permissionChecker = new PermissionChecker(
      new User(
        'u',
        'John',
        'Doe',
        'j@example.com',
        [role],
        'active',
        department,
        site,
        undefined,
        [],
      ),
    );
    useCase = new UpdateDepartmentUseCase(repository, permissionChecker);
  });

  it('should update a department via repository', async () => {
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute(department);

    expect(result).toBe(department);
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should throw when permission denied', async () => {
    const deniedChecker = mockDeep<PermissionChecker>();
    deniedChecker.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new UpdateDepartmentUseCase(repository, deniedChecker);
    await expect(useCase.execute(department)).rejects.toThrow('Forbidden');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
