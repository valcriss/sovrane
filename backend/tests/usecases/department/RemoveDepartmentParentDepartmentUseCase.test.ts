import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveDepartmentParentDepartmentUseCase } from '../../../usecases/department/RemoveDepartmentParentDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RemoveDepartmentParentDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveDepartmentParentDepartmentUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new RemoveDepartmentParentDepartmentUseCase(repository);
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
