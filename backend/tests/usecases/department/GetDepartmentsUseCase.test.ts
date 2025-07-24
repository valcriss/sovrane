import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentsUseCase } from '../../../usecases/department/GetDepartmentsUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetDepartmentsUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentsUseCase;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new GetDepartmentsUseCase(repository);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
  });

  it('should return departments from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [department], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([department]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
