import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateAuditConfigUseCase } from '../../../usecases/audit/UpdateAuditConfigUseCase';
import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { AuditConfig } from '../../../domain/entities/AuditConfig';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { AuditEventType } from '../../../domain/entities/AuditEventType';

describe('UpdateAuditConfigUseCase', () => {
  let service: DeepMockProxy<AuditConfigService>;
  let audit: DeepMockProxy<AuditPort>;
  let useCase: UpdateAuditConfigUseCase;

  beforeEach(() => {
    service = mockDeep<AuditConfigService>();
    audit = mockDeep<AuditPort>();
    useCase = new UpdateAuditConfigUseCase(service, audit);
  });

  it('should update service and log event', async () => {
    const cfg = new AuditConfig(1, ['warn'], ['system'], new Date(), 'u');
    service.update.mockResolvedValue(cfg);

    const result = await useCase.execute(['warn'], ['system'], 'u');

    expect(result).toBe(cfg);
    expect(service.update).toHaveBeenCalledWith(['warn'], ['system'], 'u');
    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.action).toBe(AuditEventType.AUDIT_CONFIG_UPDATED);
    expect(event.actorId).toBe('u');
    expect(event.actorType).toBe('user');
    expect(event.targetType).toBe('audit-config');
  });
});
