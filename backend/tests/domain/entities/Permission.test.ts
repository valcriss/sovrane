import { Permission } from '../../../domain/entities/Permission';

describe('Permission Entity', () => {
  it('should construct a permission with all properties', () => {
    const perm = new Permission('perm-1', 'READ', 'Read access');
    expect(perm.id).toBe('perm-1');
    expect(perm.permissionKey).toBe('READ');
    expect(perm.description).toBe('Read access');
  });

  it('should allow modifying mutable properties', () => {
    const perm = new Permission('perm-2', 'WRITE', 'Write access');
    perm.permissionKey = 'EDIT';
    perm.description = 'Edit access';

    expect(perm.permissionKey).toBe('EDIT');
    expect(perm.description).toBe('Edit access');
  });
});
