import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

class MockAuthService implements AuthServicePort {
  public resetToken?: string;

  constructor(private readonly user: User) {}

  async authenticate(email: string, password: string): Promise<User> {
    if (email !== this.user.email || password !== 'secret') {
      throw new Error('Invalid credentials');
    }
    return this.user;
  }

  async authenticateWithProvider(provider: string, token: string): Promise<User> {
    if (provider !== 'google' || token !== 'token') {
      throw new Error('Invalid credentials');
    }
    return this.user;
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (email !== this.user.email) {
      throw new Error('Email not found');
    }
    this.resetToken = 'reset';
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (token !== this.resetToken) {
      throw new Error('Invalid token');
    }
    this.resetToken = undefined;
  }

  async verifyToken(token: string): Promise<User> {
    if (token !== 'valid') {
      throw new Error('Invalid token');
    }
    return this.user;
  }
}

describe('AuthServicePort Interface', () => {
  let service: MockAuthService;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    role = new Role('role-1', 'User');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('u1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    service = new MockAuthService(user);
  });

  describe('authenticate', () => {
    it('should authenticate with correct credentials', async () => {
      await expect(service.authenticate('john@example.com', 'secret')).resolves.toEqual(user);
    });

    it('should throw on invalid credentials', async () => {
      await expect(service.authenticate('john@example.com', 'bad')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('authenticateWithProvider', () => {
    it('should authenticate with provider', async () => {
      await expect(service.authenticateWithProvider('google', 'token')).resolves.toEqual(user);
    });

    it('should throw on invalid provider credentials', async () => {
      await expect(service.authenticateWithProvider('google', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('password reset', () => {
    it('should request and reset password', async () => {
      await service.requestPasswordReset('john@example.com');
      await expect(service.resetPassword('reset', 'new')).resolves.toBeUndefined();
    });

    it('should throw on invalid token', async () => {
      await service.requestPasswordReset('john@example.com');
      await expect(service.resetPassword('bad', 'new')).rejects.toThrow('Invalid token');
    });
  });

  describe('verifyToken', () => {
    it('should return user on valid token', async () => {
      await expect(service.verifyToken('valid')).resolves.toEqual(user);
    });

    it('should throw on invalid token', async () => {
      await expect(service.verifyToken('bad')).rejects.toThrow('Invalid token');
    });
  });
});
