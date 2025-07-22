import { Department } from '../../../domain/entities/Department';

describe('Department Entity', () => {
  it('should construct a department with all properties', () => {
    const dept = new Department('dept-1', 'IT', null, 'user-1');
    expect(dept.id).toBe('dept-1');
    expect(dept.label).toBe('IT');
    expect(dept.parentDepartmentId).toBeNull();
    expect(dept.managerUserId).toBe('user-1');
  });

  it('should allow modifying mutable properties', () => {
    const dept = new Department('dept-2', 'HR');
    dept.label = 'Human Resources';
    dept.parentDepartmentId = 'dept-1';
    dept.managerUserId = 'user-2';

    expect(dept.label).toBe('Human Resources');
    expect(dept.parentDepartmentId).toBe('dept-1');
    expect(dept.managerUserId).toBe('user-2');
  });
});
