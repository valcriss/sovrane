import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveDepartmentPermissionUseCase } from '../../../usecases/department/RemoveDepartmentPermissionUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';

describe('RemoveDepartmentPermissionUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveDepartmentPermissionUseCase;
  let department: Department;
  let permission: Permission;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new RemoveDepartmentPermissionUseCase(repository);
    site = new Site('site-1', 'HQ');
    permission = new Permission('perm-1', 'READ', 'read');
    department = new Department('dept-1', 'IT', null, null, site, [permission]);
  });

  it('should remove permission from department', async () => {
    repository.findById.mockResolvedValue(department);
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute('dept-1', 'perm-1');

    expect(result).toBe(department);
    expect(department.permissions).toHaveLength(0);
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should return null when department not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', 'perm-1');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
