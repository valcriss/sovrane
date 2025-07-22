import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { Role } from '../../../domain/entities/Role';

// Mock implementation for testing the interface
class MockRoleRepository implements RoleRepositoryPort {
  private roles: Map<string, Role> = new Map();
  private labelIndex: Map<string, string> = new Map();

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) || null;
  }

  async findByLabel(label: string): Promise<Role | null> {
    const roleId = this.labelIndex.get(label);
    return roleId ? this.roles.get(roleId) || null : null;
  }

  async create(role: Role): Promise<Role> {
    this.roles.set(role.id, role);
    this.labelIndex.set(role.label, role.id);
    return role;
  }

  async update(role: Role): Promise<Role> {
    if (!this.roles.has(role.id)) {
      throw new Error('Role not found');
    }

    const existing = this.roles.get(role.id);
    if (existing) {
      this.labelIndex.delete(existing.label);
    }

    this.roles.set(role.id, role);
    this.labelIndex.set(role.label, role.id);
    return role;
  }

  async delete(id: string): Promise<void> {
    const role = this.roles.get(id);
    if (role) {
      this.roles.delete(id);
      this.labelIndex.delete(role.label);
    }
  }

  clear(): void {
    this.roles.clear();
    this.labelIndex.clear();
  }
}

describe('RoleRepositoryPort Interface', () => {
  let repository: MockRoleRepository;
  let adminRole: Role;

  beforeEach(() => {
    repository = new MockRoleRepository();
    adminRole = new Role('role-1', 'Admin');
  });

  afterEach(() => {
    repository.clear();
  });

  describe('create & find', () => {
    it('should create and retrieve a role', async () => {
      await repository.create(adminRole);
      const foundById = await repository.findById('role-1');
      const foundByLabel = await repository.findByLabel('Admin');

      expect(foundById).toEqual(adminRole);
      expect(foundByLabel).toEqual(adminRole);
    });
  });

  describe('update', () => {
    it('should update existing role', async () => {
      await repository.create(adminRole);
      adminRole.label = 'Super Admin';

      const updated = await repository.update(adminRole);

      expect(updated.label).toBe('Super Admin');
      expect(await repository.findByLabel('Super Admin')).toEqual(adminRole);
    });

    it('should throw when updating non-existent role', async () => {
      await expect(repository.update(adminRole)).rejects.toThrow('Role not found');
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      await repository.create(adminRole);
      await repository.delete('role-1');

      expect(await repository.findById('role-1')).toBeNull();
      expect(await repository.findByLabel('Admin')).toBeNull();
    });
  });

  describe('integration scenario', () => {
    it('should handle full lifecycle', async () => {
      const role = new Role('role-2', 'User');
      await repository.create(role);
      role.label = 'Member';
      await repository.update(role);
      await repository.delete('role-2');

      expect(await repository.findById('role-2')).toBeNull();
    });
  });
});
