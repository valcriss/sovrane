import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SetDepartmentParentDepartmentUseCase } from '../../../usecases/department/SetDepartmentParentDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('SetDepartmentParentDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: SetDepartmentParentDepartmentUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new SetDepartmentParentDepartmentUseCase(repository);
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
