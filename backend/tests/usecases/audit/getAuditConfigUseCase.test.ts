import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetAuditConfigUseCase } from '../../../usecases/audit/GetAuditConfigUseCase';
import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { AuditConfig } from '../../../domain/entities/AuditConfig';

describe('GetAuditConfigUseCase', () => {
  let service: DeepMockProxy<AuditConfigService>;
  let useCase: GetAuditConfigUseCase;

  beforeEach(() => {
    service = mockDeep<AuditConfigService>();
    useCase = new GetAuditConfigUseCase(service);
  });

  it('should return config from service', async () => {
    const cfg = new AuditConfig(1, ['info'], ['auth'], new Date(), 'u');
    service.get.mockResolvedValue(cfg);

    const result = await useCase.execute();

    expect(result).toBe(cfg);
    expect(service.get).toHaveBeenCalled();
  });

  it('should return null when missing', async () => {
    service.get.mockResolvedValue(null);

    const result = await useCase.execute();

    expect(result).toBeNull();
  });
});
