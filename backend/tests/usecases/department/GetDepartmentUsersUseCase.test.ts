import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentUsersUseCase } from '../../../usecases/department/GetDepartmentUsersUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('GetDepartmentUsersUseCase', () => {
  let repo: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetDepartmentUsersUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let checker: PermissionChecker;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [
          new Role(
            'admin',
            'Admin',
            [
              new RolePermissionAssignment(
                new Permission('p', PermissionKeys.READ_USERS, ''),
              ),
            ],
          ),
        ],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new GetDepartmentUsersUseCase(repo, checker);
    site = new Site('s','Site');
    dept = new Department('d','Dept',null,null,site);
    role = new Role('r','Role');
    user = new User('u','John','Doe','j@example.com',[role],'active',dept,site);
  });

  it('should request users from repository', async () => {
    repo.findPage.mockResolvedValue({ items:[user], page:1, limit:20, total:1 });

    const result = await useCase.execute('d', { page:1, limit:20, filters:{ search:'john' } });

    expect(result.items).toEqual([user]);
    expect(repo.findPage).toHaveBeenCalledWith({ page:1, limit:20, filters:{ search:'john', departmentId:'d' } });
  });

  it('should handle missing filters', async () => {
    repo.findPage.mockResolvedValue({ items:[user], page:1, limit:20, total:1 });

    const result = await useCase.execute('d', { page:1, limit:20 });

    expect(result.items).toEqual([user]);
    expect(repo.findPage).toHaveBeenCalledWith({ page:1, limit:20, filters:{ departmentId:'d' } });
  });
});
