import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';

class MockPermissionRepository implements PermissionRepositoryPort {
  private permissions: Map<string, Permission> = new Map();
  private keyIndex: Map<string, string> = new Map();

  async findById(id: string): Promise<Permission | null> {
    return this.permissions.get(id) || null;
  }

  async findByKey(permissionKey: string): Promise<Permission | null> {
    const id = this.keyIndex.get(permissionKey);
    return id ? this.permissions.get(id) || null : null;
  }

  async findAll(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async findPage(params: { page: number; limit: number }): Promise<{ items: Permission[]; page: number; limit: number; total: number }> {
    const items = Array.from(this.permissions.values()).slice((params.page - 1) * params.limit, params.page * params.limit);
    return { items, page: params.page, limit: params.limit, total: this.permissions.size };
  }

  async create(permission: Permission): Promise<Permission> {
    this.permissions.set(permission.id, permission);
    this.keyIndex.set(permission.permissionKey, permission.id);
    return permission;
  }

  async update(permission: Permission): Promise<Permission> {
    if (!this.permissions.has(permission.id)) {
      throw new Error('Permission not found');
    }
    const existing = this.permissions.get(permission.id);
    if (existing) this.keyIndex.delete(existing.permissionKey);
    this.permissions.set(permission.id, permission);
    this.keyIndex.set(permission.permissionKey, permission.id);
    return permission;
  }

  async delete(id: string): Promise<void> {
    const perm = this.permissions.get(id);
    if (perm) {
      this.permissions.delete(id);
      this.keyIndex.delete(perm.permissionKey);
    }
  }

  clear(): void {
    this.permissions.clear();
    this.keyIndex.clear();
  }
}

describe('PermissionRepositoryPort Interface', () => {
  let repo: MockPermissionRepository;
  let perm: Permission;

  beforeEach(() => {
    repo = new MockPermissionRepository();
    perm = new Permission('perm-1', 'READ', 'Read access');
  });

  afterEach(() => {
    repo.clear();
  });

  it('should create and retrieve a permission', async () => {
    await repo.create(perm);
    expect(await repo.findById('perm-1')).toEqual(perm);
    expect(await repo.findByKey('READ')).toEqual(perm);
    expect(await repo.findAll()).toEqual([perm]);
  });

  it('should update an existing permission', async () => {
    await repo.create(perm);
    perm.permissionKey = 'WRITE';
    perm.description = 'Write access';
    const updated = await repo.update(perm);
    expect(updated.permissionKey).toBe('WRITE');
    expect(await repo.findByKey('WRITE')).toEqual(updated);
  });

  it('should delete a permission', async () => {
    await repo.create(perm);
    await repo.delete('perm-1');
    expect(await repo.findById('perm-1')).toBeNull();
  });

  it('should list all permissions', async () => {
    await repo.create(perm);
    const perm2 = new Permission('perm-2', 'WRITE', 'Write');
    await repo.create(perm2);
    expect(await repo.findAll()).toEqual([perm, perm2]);
  });
});
