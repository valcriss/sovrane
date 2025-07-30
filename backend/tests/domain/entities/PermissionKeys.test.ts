import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('PermissionKeys constants', () => {
  it('should include audit config permissions', () => {
    expect(PermissionKeys.READ_AUDIT_CONFIG).toBe('read-audit-config');
    expect(PermissionKeys.WRITE_AUDIT_CONFIG).toBe('write-audit-config');
  });
});
