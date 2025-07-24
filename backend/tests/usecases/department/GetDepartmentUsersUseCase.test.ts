import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentUsersUseCase } from '../../../usecases/department/GetDepartmentUsersUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetDepartmentUsersUseCase', () => {
  let repo: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetDepartmentUsersUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    useCase = new GetDepartmentUsersUseCase(repo);
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
