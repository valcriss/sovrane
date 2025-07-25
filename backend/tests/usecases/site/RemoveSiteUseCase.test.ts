import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveSiteUseCase } from '../../../usecases/site/RemoveSiteUseCase';
import { SiteRepositoryPort } from '../../../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { Site } from '../../../domain/entities/Site';
import { User } from '../../../domain/entities/User';
import { Department } from '../../../domain/entities/Department';
import { Role } from '../../../domain/entities/Role';

describe('RemoveSiteUseCase', () => {
  let siteRepo: DeepMockProxy<SiteRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let departmentRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: RemoveSiteUseCase;
  let site: Site;
  let department: Department;
  let user: User;
  let role: Role;

  beforeEach(() => {
    siteRepo = mockDeep<SiteRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    departmentRepo = mockDeep<DepartmentRepositoryPort>();
    useCase = new RemoveSiteUseCase(siteRepo, userRepo, departmentRepo);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    role = new Role('role-1', 'Admin');
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should delete a site when no dependencies', async () => {
    userRepo.findBySiteId.mockResolvedValue([]);
    departmentRepo.findBySiteId.mockResolvedValue([]);

    await useCase.execute('site-1');

    expect(siteRepo.delete).toHaveBeenCalledWith('site-1');
  });

  it('should throw when users are attached to the site', async () => {
    userRepo.findBySiteId.mockResolvedValue([user]);
    departmentRepo.findBySiteId.mockResolvedValue([]);

    await expect(useCase.execute('site-1')).rejects.toThrow('Site has attached users');
    expect(siteRepo.delete).not.toHaveBeenCalled();
  });

  it('should throw when departments are attached to the site', async () => {
    userRepo.findBySiteId.mockResolvedValue([]);
    departmentRepo.findBySiteId.mockResolvedValue([department]);

    await expect(useCase.execute('site-1')).rejects.toThrow('Site has attached departments');
    expect(siteRepo.delete).not.toHaveBeenCalled();
  });
});
