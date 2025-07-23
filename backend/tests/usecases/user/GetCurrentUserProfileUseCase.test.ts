import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetCurrentUserProfileUseCase } from '../../../usecases/user/GetCurrentUserProfileUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetCurrentUserProfileUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: GetCurrentUserProfileUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    useCase = new GetCurrentUserProfileUseCase(repository);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should get current user profile via repository', async () => {
    repository.findById.mockResolvedValue(user);

    const result = await useCase.execute('user-1');

    expect(result).toBe(user);
    expect(repository.findById).toHaveBeenCalledWith('user-1');
  });
});
