import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetUsersUseCase } from '../../../usecases/user/GetUsersUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetUsersUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetUsersUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    useCase = new GetUsersUseCase(repository);
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', department, site);
  });

  it('should return users from repository', async () => {
    repository.findAll.mockResolvedValue([user]);

    const result = await useCase.execute();

    expect(result).toEqual([user]);
    expect(repository.findAll).toHaveBeenCalled();
  });
});
