import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';

describe('Department Entity', () => {
  it('should construct a department with all properties', () => {
    const site = new Site('site-1', 'HQ');
    const dept = new Department('dept-1', 'IT', null, 'user-1', site);
    expect(dept.id).toBe('dept-1');
    expect(dept.label).toBe('IT');
    expect(dept.parentDepartmentId).toBeNull();
    expect(dept.managerUserId).toBe('user-1');
  });

  it('should allow modifying mutable properties', () => {
    const site = new Site('site-1', 'HQ');
    const dept = new Department('dept-2', 'HR', null, null, site);
    dept.label = 'Human Resources';
    dept.parentDepartmentId = 'dept-1';
    dept.managerUserId = 'user-2';

    const perm = new Permission('perm-1', 'READ', 'read');
    dept.permissions.push(perm);

    expect(dept.permissions).toHaveLength(1);
    expect(dept.permissions[0]).toBe(perm);

    expect(dept.label).toBe('Human Resources');
    expect(dept.parentDepartmentId).toBe('dept-1');
    expect(dept.managerUserId).toBe('user-2');
    expect(dept.site).toBe(site);
  });
});
