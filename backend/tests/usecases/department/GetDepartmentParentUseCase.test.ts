import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentParentUseCase } from '../../../usecases/department/GetDepartmentParentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';


describe('GetDepartmentParentUseCase', () => {
  let repo: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: GetDepartmentParentUseCase;
  let site: Site;
  let parent: Department;
  let child: Department;
  let checker: PermissionChecker;

  beforeEach(() => {
    repo = mockDeep<DepartmentRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new Permission('p', PermissionKeys.READ_DEPARTMENT, '')])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new GetDepartmentParentUseCase(repo, checker);
    site = new Site('s', 'Site');
    parent = new Department('p','Parent',null,null,site);
    child = new Department('c','Child','p',null,site);
  });

  it('should return parent department', async () => {
    repo.findById.mockResolvedValueOnce(child).mockResolvedValueOnce(parent);

    const result = await useCase.execute('c');

    expect(result).toBe(parent);
    expect(repo.findById).toHaveBeenCalledTimes(2);
  });

  it('should return null when no parent', async () => {
    repo.findById.mockResolvedValue(new Department('c','Child',null,null,site));

    const result = await useCase.execute('c');

    expect(result).toBeNull();
  });
});
