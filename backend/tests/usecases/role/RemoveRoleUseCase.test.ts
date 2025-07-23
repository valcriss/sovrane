import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveRoleUseCase } from '../../../usecases/role/RemoveRoleUseCase';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RemoveRoleUseCase', () => {
  let roleRepo: DeepMockProxy<RoleRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: RemoveRoleUseCase;
  let role: Role;
  let site: Site;
  let department: Department;
  let user: User;

  beforeEach(() => {
    roleRepo = mockDeep<RoleRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    useCase = new RemoveRoleUseCase(roleRepo, userRepo);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should delete a role when no users are assigned', async () => {
    userRepo.findByRoleId.mockResolvedValue([]);

    await useCase.execute('role-1');

    expect(roleRepo.delete).toHaveBeenCalledWith('role-1');
  });

  it('should throw when users are assigned to the role', async () => {
    userRepo.findByRoleId.mockResolvedValue([user]);

    await expect(useCase.execute('role-1')).rejects.toThrow('Role is assigned to users');
    expect(roleRepo.delete).not.toHaveBeenCalled();
  });
});
