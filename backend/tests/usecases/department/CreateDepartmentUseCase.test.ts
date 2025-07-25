import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateDepartmentUseCase } from '../../../usecases/department/CreateDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('CreateDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: CreateDepartmentUseCase;
  let department: Department;
  let site: Site;
  let permissionChecker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    const role = new Role('r', 'Role', [new Permission('p', PermissionKeys.CREATE_DEPARTMENT, 'create')]);
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
    useCase = new CreateDepartmentUseCase(repository, permissionChecker);
  });

  it('should create a department via repository', async () => {
    repository.create.mockResolvedValue(department);

    const result = await useCase.execute(department);

    expect(result).toBe(department);
    expect(repository.create).toHaveBeenCalledWith(department);
  });

  it('should throw when permission denied', async () => {
    const deniedChecker = mockDeep<PermissionChecker>();
    deniedChecker.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new CreateDepartmentUseCase(repository, deniedChecker);
    await expect(useCase.execute(department)).rejects.toThrow('Forbidden');
    expect(repository.create).not.toHaveBeenCalled();
  });
});
