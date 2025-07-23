import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SetDepartmentManagerUseCase } from '../../../usecases/department/SetDepartmentManagerUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('SetDepartmentManagerUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: SetDepartmentManagerUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new SetDepartmentManagerUseCase(repository);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
  });

  it('should set manager on department', async () => {
    repository.findById.mockResolvedValue(department);
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute('dept-1', 'user-1');

    expect(result).toBe(department);
    expect(department.managerUserId).toBe('user-1');
    expect(repository.update).toHaveBeenCalledWith(department);
  });

  it('should return null when department not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', 'user-1');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
