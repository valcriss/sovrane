import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ChangeUserStatusUseCase } from '../../../usecases/user/ChangeUserStatusUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('ChangeUserStatusUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: ChangeUserStatusUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    useCase = new ChangeUserStatusUseCase(repository);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should change user status via repository', async () => {
    repository.findById.mockResolvedValue(user);
    repository.update.mockResolvedValue(user);

    const result = await useCase.execute('user-1', 'suspended');

    expect(result).toBe(user);
    expect(user.status).toBe('suspended');
    expect(repository.findById).toHaveBeenCalledWith('user-1');
    expect(repository.update).toHaveBeenCalledWith(user);
  });

  it('should return null when user is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing', 'archived');

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
