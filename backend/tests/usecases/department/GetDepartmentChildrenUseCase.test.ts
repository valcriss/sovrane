import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentChildrenUseCase } from '../../../usecases/department/GetDepartmentChildrenUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetDepartmentChildrenUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentChildrenUseCase;
  let site: Site;
  let child1: Department;
  let child2: Department;
  let other: Department;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    useCase = new GetDepartmentChildrenUseCase(repository);
    site = new Site('s', 'Site');
    child1 = new Department('c1', 'Child1', 'p', null, site);
    child2 = new Department('c2', 'Child2', 'p', null, site);
    other = new Department('o', 'Other', null, null, site);
  });

  it('should filter, paginate and return children', async () => {
    repository.findAll.mockResolvedValue([child1, child2, other]);

    const result = await useCase.execute('p', { page: 1, limit: 1, filters: { search: 'child1' } });

    expect(result.items).toEqual([child1]);
    expect(result.total).toBe(1);
    expect(repository.findAll).toHaveBeenCalled();
  });

  it('should filter by site', async () => {
    const otherSite = new Site('x', 'Other');
    const foreign = new Department('c3', 'X', 'p', null, otherSite);
    repository.findAll.mockResolvedValue([child1, foreign]);

    const result = await useCase.execute('p', { page: 1, limit: 5, filters: { siteId: 's' } });

    expect(result.items).toEqual([child1]);
    expect(result.total).toBe(1);
  });

  it('should handle pagination without filters', async () => {
    repository.findAll.mockResolvedValue([child1, child2]);

    const result = await useCase.execute('p', { page: 2, limit: 1 });

    expect(result.items).toEqual([child2]);
  });
});
