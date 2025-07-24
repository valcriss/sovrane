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
    group = new UserGroup('g', 'Group', user, [user], 'desc');
  });

  it('should construct a group with all properties', () => {
    expect(group.id).toBe('g');
    expect(group.name).toBe('Group');
    expect(group.description).toBe('desc');
    expect(group.responsibleUser).toBe(user);
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
    const g = new UserGroup('id', 'label', user);
    expect(g.members).toEqual([]);
    expect(g.description).toBeUndefined();
  });
});
