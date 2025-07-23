import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AddDepartmentUserUseCase } from '../../../usecases/department/AddDepartmentUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('AddDepartmentUserUseCase', () => {
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let useCase: AddDepartmentUserUseCase;
  let user: User;
  let department: Department;
  let newDepartment: Department;
  let role: Role;
  let site: Site;

  beforeEach(() => {
    userRepo = mockDeep<UserRepositoryPort>();
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    useCase = new AddDepartmentUserUseCase(userRepo, deptRepo);
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    newDepartment = new Department('dept-2', 'HR', null, null, site);
    role = new Role('role-1', 'Admin');
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should move user to new department', async () => {
    userRepo.findById.mockResolvedValue(user);
    deptRepo.findById.mockResolvedValue(newDepartment);
    userRepo.update.mockResolvedValue(user);

    const result = await useCase.execute('user-1', 'dept-2');

    expect(result).toBe(user);
    expect(user.department).toBe(newDepartment);
    expect(userRepo.update).toHaveBeenCalledWith(user);
  });

  it('should return null when user or department is missing', async () => {
    userRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', 'dept-2');

    expect(result).toBeNull();
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
