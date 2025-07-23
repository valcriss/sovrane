import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveDepartmentManagerUseCase } from '../../../usecases/department/RemoveDepartmentManagerUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RemoveDepartmentManagerUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveDepartmentManagerUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new RemoveDepartmentManagerUseCase(repository);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, 'manager', site);
  });

  it('should remove manager from department', async () => {
    repository.findById.mockResolvedValue(department);
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute('dept-1');

    expect(result).toBe(department);
    expect(department.managerUserId).toBeNull();
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should return null when department not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
