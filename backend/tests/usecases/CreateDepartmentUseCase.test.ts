import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateDepartmentUseCase } from '../../usecases/CreateDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';

describe('CreateDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: CreateDepartmentUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new CreateDepartmentUseCase(repository);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
  });

  it('should create a department via repository', async () => {
    repository.create.mockResolvedValue(department);

    const result = await useCase.execute(department);

    expect(result).toBe(department);
    expect(repository.create).toHaveBeenCalledWith(department);
  });
});
