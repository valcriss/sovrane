import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetUserUseCase } from '../../../usecases/user/GetUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetUserUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetUserUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    useCase = new GetUserUseCase(repository);
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', department, site);
  });

  it('should return user by id', async () => {
    repository.findById.mockResolvedValue(user);

    const result = await useCase.execute('u');

    expect(result).toBe(user);
    expect(repository.findById).toHaveBeenCalledWith('u');
  });
});
