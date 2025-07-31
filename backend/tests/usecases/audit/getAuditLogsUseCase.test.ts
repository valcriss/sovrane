import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetAuditLogsUseCase } from '../../../usecases/audit/GetAuditLogsUseCase';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { AuditConfigService } from '../../../domain/services/AuditConfigService';
import { AuditConfig } from '../../../domain/entities/AuditConfig';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GetAuditLogsUseCase', () => {
  let port: DeepMockProxy<AuditPort>;
  let checker: PermissionChecker;
  let useCase: GetAuditLogsUseCase;
  let event: AuditEvent;
  let config: DeepMockProxy<AuditConfigService>;

  beforeEach(() => {
    port = mockDeep<AuditPort>();
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const perm = new Permission('p', PermissionKeys.VIEW_AUDIT_LOGS, '');
    const role = new Role('r', 'Role', [perm]);
    const user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', dept, site);
    checker = new PermissionChecker(user);
    config = mockDeep<AuditConfigService>();
    useCase = new GetAuditLogsUseCase(port, checker, config);
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
    useCase = new GetAuditLogsUseCase(port, denied, config);

    await expect(useCase.execute({ page: 1, limit: 20 })).rejects.toThrow('Forbidden');
    expect(port.findPaginated).not.toHaveBeenCalled();
  });

  it('should filter events by level', async () => {
    const e1 = new AuditEvent(new Date('2024-01-02T00:00:00Z'), 'u', 'user', 'auth.refresh', undefined, undefined, { level: 'info' });
    const e2 = new AuditEvent(new Date('2024-01-03T00:00:00Z'), 'u', 'user', 'auth.refresh', undefined, undefined, { level: 'error' });
    port.findPaginated.mockResolvedValue({ items: [e1, e2], page: 1, limit: 20, total: 2 });
    config.get.mockResolvedValue(new AuditConfig(1, ['error'], ['auth'], new Date(), 'u'));

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([e2]);
  });

  it('should filter events by category', async () => {
    const e1 = new AuditEvent(new Date('2024-01-04T00:00:00Z'), 'u', 'user', 'user.loginFailed', undefined, undefined, { level: 'info' });
    const e2 = new AuditEvent(new Date('2024-01-05T00:00:00Z'), 'u', 'user', 'auth.refresh', undefined, undefined, { level: 'info' });
    port.findPaginated.mockResolvedValue({ items: [e1, e2], page: 1, limit: 20, total: 2 });
    config.get.mockResolvedValue(new AuditConfig(1, ['info'], ['user'], new Date(), 'u'));

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([e1]);
  });

  it('should return all events when config disabled', async () => {
    const e1 = new AuditEvent(new Date('2024-01-06T00:00:00Z'), 'u', 'user', 'auth.refresh', undefined, undefined, { level: 'info' });
    const e2 = new AuditEvent(new Date('2024-01-07T00:00:00Z'), 'u', 'user', 'user.loginFailed', undefined, undefined, { level: 'error' });
    port.findPaginated.mockResolvedValue({ items: [e1, e2], page: 1, limit: 20, total: 2 });
    config.get.mockResolvedValue(new AuditConfig(1, [], [], new Date(), 'u'));

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([e1, e2]);
  });

  it('should return unfiltered when config missing', async () => {
    const e1 = new AuditEvent(new Date('2024-01-08T00:00:00Z'), 'u', 'user', 'auth.refresh');
    port.findPaginated.mockResolvedValue({ items: [e1], page: 1, limit: 20, total: 1 });
    config.get.mockResolvedValue(null);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([e1]);
  });

  it('should default level to info when missing', async () => {
    const e1 = new AuditEvent(new Date('2024-01-09T00:00:00Z'), 'u', 'user', 'auth.refresh');
    port.findPaginated.mockResolvedValue({ items: [e1], page: 1, limit: 20, total: 1 });
    config.get.mockResolvedValue(new AuditConfig(1, ['info'], ['auth'], new Date(), 'u'));

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([e1]);
  });
});

