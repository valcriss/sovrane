import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetDepartmentManagerUseCase } from '../../../usecases/department/GetDepartmentManagerUseCase';
import { DepartmentRepositoryPort } from '../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { Department } from '../../../domain/entities/Department';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Site } from '../../../domain/entities/Site';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';


describe('GetDepartmentManagerUseCase', () => {
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetDepartmentManagerUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let checker: PermissionChecker;

  beforeEach(() => {
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
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
    useCase = new GetDepartmentManagerUseCase(deptRepo, userRepo, checker);
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

  it('should return null when department not found', async () => {
    deptRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute('d');

    expect(result).toBeNull();
  });
});
