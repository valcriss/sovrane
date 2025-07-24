import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

// Mock implementation for testing the interface
class MockUserRepository implements UserRepositoryPort {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private externalIndex: Map<string, string> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) || null : null;
  }

  async findByExternalAuth(provider: string, externalId: string): Promise<User | null> {
    const key = `${provider}:${externalId}`;
    const userId = this.externalIndex.get(key);
    return userId ? this.users.get(userId) || null : null;
  }

  async findByDepartmentId(departmentId: string): Promise<User[]> {
    const result: User[] = [];
    for (const user of this.users.values()) {
      if (user.department.id === departmentId) {
        result.push(user);
      }
    }
    return result;
  }

  async findByRoleId(roleId: string): Promise<User[]> {
    const result: User[] = [];
    for (const user of this.users.values()) {
      if (user.roles.some(r => r.id === roleId)) {
        result.push(user);
      }
    }
    return result;
  }

  async findBySiteId(siteId: string): Promise<User[]> {
    const result: User[] = [];
    for (const user of this.users.values()) {
      if (user.site.id === siteId) {
        result.push(user);
      }
    }
    return result;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  async update(user: User): Promise<User> {
    if (!this.users.has(user.id)) {
      throw new Error('User not found');
    }
    
    const existingUser = this.users.get(user.id);
    if (existingUser) {
      // Remove old email index
      this.emailIndex.delete(existingUser.email);
    }
    
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.delete(id);
      this.emailIndex.delete(user.email);
      for (const [key, uid] of this.externalIndex.entries()) {
        if (uid === id) {
          this.externalIndex.delete(key);
        }
      }
    }
  }

  // Helper method for testing
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
    this.externalIndex.clear();
  }

  // Utility for tests to simulate external auth binding
  setExternalAuth(userId: string, provider: string, externalId: string): void {
    this.externalIndex.set(`${provider}:${externalId}`, userId);
  }
}

describe('UserRepositoryPort Interface', () => {
  let repository: MockUserRepository;
  let testUser: User;
  let testRole: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = new MockUserRepository();
    testRole = new Role('role-123', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    testUser = new User(
      'user-123',
      'John',
      'Doe',
      'john.doe@example.com',
      [testRole],
      'active',
      department,
      site
    );
  });

  afterEach(() => {
    repository.clear();
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const result = await repository.create(testUser);

      expect(result).toEqual(testUser);
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('john.doe@example.com');
      expect(await repository.findAll()).toEqual([testUser]);
    });

    it('should allow creating multiple users', async () => {
      const user2 = new User(
        'user-456',
        'Jane',
        'Smith',
        'jane.smith@example.com',
        [],
        'active',
        department,
        site
      );

      await repository.create(testUser);
      await repository.create(user2);

      const foundUser1 = await repository.findById('user-123');
      const foundUser2 = await repository.findById('user-456');

      expect(foundUser1).toEqual(testUser);
      expect(foundUser2).toEqual(user2);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      await repository.create(testUser);

      const result = await repository.findById('user-123');

      expect(result).toEqual(testUser);
    });

    it('should return null when user not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      await repository.create(testUser);

      const result = await repository.findByEmail('john.doe@example.com');

      expect(result).toEqual(testUser);
    });

    it('should return null when user not found by email', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle case sensitivity correctly', async () => {
      await repository.create(testUser);

      const result = await repository.findByEmail('JOHN.DOE@EXAMPLE.COM');

      expect(result).toBeNull(); // Case sensitive
    });
  });

  describe('findByExternalAuth', () => {
    it('should return user when found via provider and id', async () => {
      await repository.create(testUser);
      repository.setExternalAuth('user-123', 'google', 'g123');

      const result = await repository.findByExternalAuth('google', 'g123');

      expect(result).toEqual(testUser);
    });

    it('should return null when external auth not registered', async () => {
      await repository.create(testUser);

      const result = await repository.findByExternalAuth('github', 'x999');

      expect(result).toBeNull();
    });
  });

  describe('findByDepartmentId', () => {
    it('should return users belonging to department', async () => {
      await repository.create(testUser);

      const result = await repository.findByDepartmentId('dept-1');

      expect(result).toEqual([testUser]);
    });

    it('should return empty array when no users match', async () => {
      const result = await repository.findByDepartmentId('missing');

      expect(result).toEqual([]);
    });
  });

  describe('findByRoleId', () => {
    it('should return users with given role', async () => {
      await repository.create(testUser);

      const result = await repository.findByRoleId('role-123');

      expect(result).toEqual([testUser]);
    });

    it('should return empty array when no users have role', async () => {
      const result = await repository.findByRoleId('missing');

      expect(result).toEqual([]);
    });
  });

  describe('findBySiteId', () => {
    it('should return users belonging to a site', async () => {
      await repository.create(testUser);

      const result = await repository.findBySiteId('site-1');

      expect(result).toEqual([testUser]);
    });

    it('should return empty array when no users belong to site', async () => {
      const result = await repository.findBySiteId('missing');

      expect(result).toEqual([]);
    });
  });

  it('should list all users', async () => {
    await repository.create(testUser);
    const user2 = new User('user-2', 'Jane', 'Smith', 'jane@example.com', [], 'active', department, site);
    await repository.create(user2);
    expect(await repository.findAll()).toEqual([testUser, user2]);
  });

  describe('update', () => {
    it('should update existing user', async () => {
      await repository.create(testUser);

      testUser.firstName = 'Johnny';
      testUser.status = 'suspended';

      const result = await repository.update(testUser);

      expect(result.firstName).toBe('Johnny');
      expect(result.status).toBe('suspended');

      const foundUser = await repository.findById('user-123');
      expect(foundUser?.firstName).toBe('Johnny');
      expect(foundUser?.status).toBe('suspended');
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(repository.update(testUser)).rejects.toThrow('User not found');
    });

    it('should handle email change in update', async () => {
      await repository.create(testUser);

      // Create a new user object with updated email
      const updatedUser = new User(
        testUser.id,
        testUser.firstName,
        testUser.lastName,
        'newemail@example.com',
        testUser.roles,
        testUser.status,
        department,
        site
      );
      
      await repository.update(updatedUser);

      const foundByOldEmail = await repository.findByEmail('john.doe@example.com');
      const foundByNewEmail = await repository.findByEmail('newemail@example.com');

      expect(foundByOldEmail).toBeNull();
      expect(foundByNewEmail).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete existing user', async () => {
      await repository.create(testUser);

      await repository.delete('user-123');

      const result = await repository.findById('user-123');
      expect(result).toBeNull();

      const resultByEmail = await repository.findByEmail('john.doe@example.com');
      expect(resultByEmail).toBeNull();
    });

    it('should not throw error when deleting non-existent user', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete user lifecycle', async () => {
      // Create
      await repository.create(testUser);
      let found = await repository.findById('user-123');
      expect(found).toEqual(testUser);

      // Update
      testUser.firstName = 'Johnny';
      await repository.update(testUser);
      found = await repository.findById('user-123');
      expect(found?.firstName).toBe('Johnny');

      // Delete
      await repository.delete('user-123');
      found = await repository.findById('user-123');
      expect(found).toBeNull();
    });

    it('should maintain data consistency across operations', async () => {
      const user1 = new User('user-1', 'User', 'One', 'user1@example.com', [], 'active', department, site);
      const user2 = new User('user-2', 'User', 'Two', 'user2@example.com', [], 'active', department, site);

      await repository.create(user1);
      await repository.create(user2);

      // Both should be findable by ID
      expect(await repository.findById('user-1')).toEqual(user1);
      expect(await repository.findById('user-2')).toEqual(user2);

      // Both should be findable by email
      expect(await repository.findByEmail('user1@example.com')).toEqual(user1);
      expect(await repository.findByEmail('user2@example.com')).toEqual(user2);

      // Delete one shouldn't affect the other
      await repository.delete('user-1');
      expect(await repository.findById('user-1')).toBeNull();
      expect(await repository.findById('user-2')).toEqual(user2);
    });
  });
});
