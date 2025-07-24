import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

class MockGroupRepository implements UserGroupRepositoryPort {
  private groups: Map<string, UserGroup> = new Map();

  async findById(id: string): Promise<UserGroup | null> {
    return this.groups.get(id) || null;
  }

  async findAll(): Promise<UserGroup[]> {
    return Array.from(this.groups.values());
  }

  async findPage(params: { page: number; limit: number }): Promise<{ items: UserGroup[]; page: number; limit: number; total: number }> {
    const items = Array.from(this.groups.values()).slice((params.page - 1) * params.limit, params.page * params.limit);
    return { items, page: params.page, limit: params.limit, total: this.groups.size };
  }

  async create(group: UserGroup): Promise<UserGroup> {
    this.groups.set(group.id, group);
    return group;
  }

  async update(group: UserGroup): Promise<UserGroup> {
    if (!this.groups.has(group.id)) throw new Error('not found');
    this.groups.set(group.id, group);
    return group;
  }

  async delete(id: string): Promise<void> {
    this.groups.delete(id);
  }

  async addUser(groupId: string, userId: string): Promise<UserGroup | null> {
    const group = this.groups.get(groupId);
    const user = users.get(userId);
    if (!group || !user) return null;
    group.members.push(user);
    return group;
  }

  async removeUser(groupId: string, userId: string): Promise<UserGroup | null> {
    const group = this.groups.get(groupId);
    if (!group) return null;
    group.members = group.members.filter(u => u.id !== userId);
    return group;
  }
}

const users = new Map<string, User>();

describe('UserGroupRepositoryPort Interface', () => {
  let repo: MockGroupRepository;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach(() => {
    repo = new MockGroupRepository();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    users.set('u', user);
    group = new UserGroup('g', 'Group', user, [user]);
  });

  afterEach(() => {
    users.clear();
  });

  it('should create and retrieve', async () => {
    await repo.create(group);
    expect(await repo.findById('g')).toEqual(group);
    expect(await repo.findAll()).toEqual([group]);
  });

  it('should update', async () => {
    await repo.create(group);
    group.name = 'New';
    const updated = await repo.update(group);
    expect(updated.name).toBe('New');
  });

  it('should delete', async () => {
    await repo.create(group);
    await repo.delete('g');
    expect(await repo.findById('g')).toBeNull();
  });

  it('should add and remove user', async () => {
    await repo.create(group);
    const other = new User('u2', 'Jane', 'Doe', 'jane@example.com', [role], 'active', dept, site);
    users.set('u2', other);
    await repo.addUser('g', 'u2');
    expect((await repo.findById('g'))?.members).toHaveLength(2);
    await repo.removeUser('g', 'u2');
    expect((await repo.findById('g'))?.members).toHaveLength(1);
  });
});
