import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentManagerUseCase } from '../../../usecases/department/GetDepartmentManagerUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Site } from '../../../domain/entities/Site';


describe('GetDepartmentManagerUseCase', () => {
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetDepartmentManagerUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach(() => {
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    useCase = new GetDepartmentManagerUseCase(deptRepo, userRepo);
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, 'u', site);
    role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', dept, site);
  });

  it('should return manager user', async () => {
    deptRepo.findById.mockResolvedValue(dept);
    userRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute('d');

    expect(result).toBe(user);
    expect(userRepo.findById).toHaveBeenCalledWith('u');
  });

  it('should return null when manager missing', async () => {
    deptRepo.findById.mockResolvedValue(new Department('d','Dept',null,null,site));

    const result = await useCase.execute('d');

    expect(result).toBeNull();
  });
});
