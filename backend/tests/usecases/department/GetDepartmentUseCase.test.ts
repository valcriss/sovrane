import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentUseCase } from '../../../usecases/department/GetDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentUseCase;
  let department: Department;
  let site: Site;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role', [new Permission('p', PermissionKeys.READ_DEPARTMENT, 'read')]);
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
    useCase = new GetDepartmentUseCase(repository, permissionChecker);
  });

  it('should return a department by id', async () => {
    repository.findById.mockResolvedValue(department);

    const result = await useCase.execute('d');

    expect(result).toBe(department);
    expect(repository.findById).toHaveBeenCalledWith('d');
  });

  it('should throw when permission denied', async () => {
    const deniedChecker = mockDeep<PermissionChecker>();
    deniedChecker.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new GetDepartmentUseCase(repository, deniedChecker);
    await expect(useCase.execute('d')).rejects.toThrow('Forbidden');
    expect(repository.findById).not.toHaveBeenCalled();
  });
});
