import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentUseCase } from '../../../usecases/department/GetDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new GetDepartmentUseCase(repository);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
  });

  it('should return a department by id', async () => {
    repository.findById.mockResolvedValue(department);

    const result = await useCase.execute('d');

    expect(result).toBe(department);
    expect(repository.findById).toHaveBeenCalledWith('d');
  });
});
