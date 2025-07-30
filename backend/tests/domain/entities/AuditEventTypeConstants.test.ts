import { AuditEventType } from '../../../domain/entities/AuditEventType';

describe('AuditEventType constants', () => {
  it('should include audit config updated event', () => {
    expect(AuditEventType.AUDIT_CONFIG_UPDATED).toBe('auditConfig.updated');
  });
});
