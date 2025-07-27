import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetAuditLogsUseCase } from '../../../usecases/audit/GetAuditLogsUseCase';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetAuditLogsUseCase', () => {
  let port: DeepMockProxy<AuditPort>;
  let checker: PermissionChecker;
  let useCase: GetAuditLogsUseCase;
  let event: AuditEvent;

  beforeEach(() => {
    port = mockDeep<AuditPort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const perm = new Permission('p', PermissionKeys.VIEW_AUDIT_LOGS, '');
    const role = new Role('r', 'Role', [perm]);
    const user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', dept, site);
    checker = new PermissionChecker(user);
    useCase = new GetAuditLogsUseCase(port, checker);
    event = new AuditEvent(new Date('2024-01-01T00:00:00Z'), 'u', 'user', 'action');
  });

  it('should return logs from port', async () => {
    port.findPaginated.mockResolvedValue({ items: [event], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([event]);
    expect(port.findPaginated).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new GetAuditLogsUseCase(port, denied);

    await expect(useCase.execute({ page: 1, limit: 20 })).rejects.toThrow('Forbidden');
    expect(port.findPaginated).not.toHaveBeenCalled();
  });
});

