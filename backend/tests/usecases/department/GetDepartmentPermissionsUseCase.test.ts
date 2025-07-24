import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentPermissionsUseCase } from '../../../usecases/department/GetDepartmentPermissionsUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';

describe('GetDepartmentPermissionsUseCase', () => {
  let repo: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentPermissionsUseCase;
  let site: Site;
  let permission: Permission;
  let other: Permission;
  let dept: Department;

  beforeEach(() => {
    repo = mockDeep<DepartmentRepositoryPort>();
    useCase = new GetDepartmentPermissionsUseCase(repo);
    site = new Site('s', 'Site');
    permission = new Permission('p1','perm1','desc');
    other = new Permission('p2','perm2','other');
    dept = new Department('d','Dept',null,null,site,[permission, other]);
  });

  it('should filter and paginate permissions', async () => {
    repo.findById.mockResolvedValue(dept);

    const result = await useCase.execute('d', { page:1, limit:1, filters:{ search:'perm1' } });

    expect(result.items).toEqual([permission]);
    expect(result.total).toBe(1);
  });

  it('should return empty when department missing', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute('d', { page:1, limit:1 });

    expect(result.total).toBe(0);
  });
});
