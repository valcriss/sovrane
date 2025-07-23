import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateDepartmentUseCase } from '../../../usecases/department/UpdateDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('UpdateDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: UpdateDepartmentUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new UpdateDepartmentUseCase(repository);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
  });

  it('should update a department via repository', async () => {
    repository.update.mockResolvedValue(department);

    const result = await useCase.execute(department);

    expect(result).toBe(department);
    expect(repository.update).toHaveBeenCalledWith(department);
  });
});
