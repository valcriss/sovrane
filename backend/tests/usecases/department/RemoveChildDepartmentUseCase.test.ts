import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveChildDepartmentUseCase } from '../../../usecases/department/RemoveChildDepartmentUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('RemoveChildDepartmentUseCase', () => {
  let repository: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveChildDepartmentUseCase;
  let child: Department;
  let site: Site;
  let checker: PermissionChecker;

  beforeEach(() => {
    repository = mockDeep<DepartmentRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new Permission('p', PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY, '')])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new RemoveChildDepartmentUseCase(repository, checker);
    site = new Site('site-1', 'HQ');
    child = new Department('child', 'IT', 'parent', null, site);
  });

  it('should remove parent from child department', async () => {
    repository.findById.mockResolvedValue(child);
    repository.update.mockResolvedValue(child);

    const result = await useCase.execute('child');

    expect(result).toBe(child);
    expect(child.parentDepartmentId).toBeNull();
    expect(repository.update).toHaveBeenCalledWith(child);
  });

  it('should return null when child not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
