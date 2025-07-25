import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentPermissionsUseCase } from '../../../usecases/department/GetDepartmentPermissionsUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('GetDepartmentPermissionsUseCase', () => {
  let repo: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentPermissionsUseCase;
  let site: Site;
  let permission: Permission;
  let other: Permission;
  let dept: Department;
  let checker: PermissionChecker;

  beforeEach(() => {
    repo = mockDeep<DepartmentRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new Permission('p', PermissionKeys.MANAGE_DEPARTMENT_PERMISSIONS, '')])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new GetDepartmentPermissionsUseCase(repo, checker);
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
