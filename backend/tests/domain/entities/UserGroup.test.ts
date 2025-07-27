import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('UserGroup Entity', () => {
  let group: UserGroup;
  let user: User;
  let site: Site;
  let department: Department;
  let role: Role;

  beforeEach(() => {
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    group = new UserGroup('g', 'Group', [user], [user], 'desc');
  });

  it('should construct a group with all properties', () => {
    expect(group.id).toBe('g');
    expect(group.name).toBe('Group');
    expect(group.description).toBe('desc');
    expect(group.responsibleUsers).toEqual([user]);
    expect(group.members).toEqual([user]);
  });

  it('should allow modifying mutable fields', () => {
    const other = new User('u2', 'Jane', 'Doe', 'jane@example.com', [role], 'active', department, site);
    group.name = 'New';
    group.description = 'newdesc';
    group.members.push(other);
    expect(group.name).toBe('New');
    expect(group.description).toBe('newdesc');
    expect(group.members).toHaveLength(2);
  });

  it('should use defaults when optional params omitted', () => {
    const g = new UserGroup('id', 'label');
    expect(g.members).toEqual([]);
    expect(g.responsibleUsers).toEqual([]);
    expect(g.description).toBeUndefined();
    expect(g.createdAt).toBeInstanceOf(Date);
    expect(g.updatedAt).toEqual(g.createdAt);
    expect(g.createdBy).toBeNull();
    expect(g.updatedBy).toBeNull();
  });

  it('should accept custom audit information', () => {
    const creator = new User('c', 'C', 'R', 'c@r.io', [role], 'active', department, site);
    const updater = new User('u2', 'U', 'P', 'u@p.io', [role], 'active', department, site);
    const date = new Date('2020-01-01T00:00:00Z');
    const audited = new UserGroup('id2', 'name', [], [], undefined, date, date, creator, updater);
    expect(audited.createdAt).toBe(date);
    expect(audited.updatedAt).toBe(date);
    expect(audited.createdBy).toBe(creator);
    expect(audited.updatedBy).toBe(updater);
  });
});
