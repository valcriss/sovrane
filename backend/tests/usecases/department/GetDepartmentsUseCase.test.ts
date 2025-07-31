import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentsUseCase } from '../../../usecases/department/GetDepartmentsUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('GetDepartmentsUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentsUseCase;
  let department: Department;
  let site: Site;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    const role = new Role(
      'r',
      'Role',
      [new RolePermissionAssignment(new Permission('p', PermissionKeys.READ_DEPARTMENTS, 'read'))],
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
    useCase = new GetDepartmentsUseCase(repository, permissionChecker);
  });

  it('should return departments from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [department], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([department]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('should throw when permission denied', async () => {
    const deniedChecker = mockDeep<PermissionChecker>();
    deniedChecker.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new GetDepartmentsUseCase(repository, deniedChecker);
    await expect(useCase.execute({ page: 1, limit: 20 })).rejects.toThrow('Forbidden');
    expect(repository.findPage).not.toHaveBeenCalled();
  });
});
