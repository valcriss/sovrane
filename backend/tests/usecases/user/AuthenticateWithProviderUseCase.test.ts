import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthenticateWithProviderUseCase } from '../../../usecases/user/AuthenticateWithProviderUseCase';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('AuthenticateWithProviderUseCase', () => {
  let service: DeepMockProxy<AuthServicePort>;
  let useCase: AuthenticateWithProviderUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    service = mockDeep<AuthServicePort>();
    useCase = new AuthenticateWithProviderUseCase(service);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should authenticate via provider', async () => {
    service.authenticateWithProvider.mockResolvedValue(user);

    const result = await useCase.execute('google', 'token');

    expect(result).toBe(user);
    expect(service.authenticateWithProvider).toHaveBeenCalledWith('google', 'token');
  });
});
