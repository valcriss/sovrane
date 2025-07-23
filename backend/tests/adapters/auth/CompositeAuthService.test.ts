import { CompositeAuthService } from '../../../adapters/auth/CompositeAuthService';
import { mockDeep } from 'jest-mock-extended';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('CompositeAuthService', () => {
  let primary: ReturnType<typeof mockDeep<AuthServicePort>>;
  let secondary: ReturnType<typeof mockDeep<AuthServicePort>>;
  let service: CompositeAuthService;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    primary = mockDeep<AuthServicePort>();
    secondary = mockDeep<AuthServicePort>();
    service = new CompositeAuthService([primary, secondary]);
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should delegate verification to services in order', async () => {
    primary.verifyToken.mockRejectedValue(new Error('bad'));
    secondary.verifyToken.mockResolvedValue(user);

    const result = await service.verifyToken('tok');

    expect(result).toBe(user);
    expect(primary.verifyToken).toHaveBeenCalled();
    expect(secondary.verifyToken).toHaveBeenCalled();
  });

  it('should throw when all services fail', async () => {
    primary.verifyToken.mockRejectedValue(new Error('bad'));
    secondary.verifyToken.mockRejectedValue(new Error('bad'));

    await expect(service.verifyToken('tok')).rejects.toThrow('Invalid token');
  });

  it('should forward other operations to first service', async () => {
    primary.authenticate.mockResolvedValue(user);
    const result = await service.authenticate('e', 'p');
    expect(result).toBe(user);
    expect(primary.authenticate).toHaveBeenCalled();
    await service.requestPasswordReset('e');
    expect(primary.requestPasswordReset).toHaveBeenCalled();
    await service.resetPassword('t', 'p');
    expect(primary.resetPassword).toHaveBeenCalled();
    primary.authenticateWithProvider.mockResolvedValue(user);
    const result2 = await service.authenticateWithProvider('google', 't');
    expect(result2).toBe(user);
    expect(primary.authenticateWithProvider).toHaveBeenCalled();
  });

  it('should throw when provider auth fails on all services', async () => {
    primary.authenticateWithProvider.mockRejectedValue(new Error('bad'));
    secondary.authenticateWithProvider.mockRejectedValue(new Error('bad'));
    await expect(service.authenticateWithProvider('google', 't')).rejects.toThrow('Invalid credentials');
  });

  it('should return first service result when successful', async () => {
    primary.verifyToken.mockResolvedValue(user);
    const result = await service.verifyToken('tok');
    expect(result).toBe(user);
    expect(secondary.verifyToken).not.toHaveBeenCalled();
  });
});
