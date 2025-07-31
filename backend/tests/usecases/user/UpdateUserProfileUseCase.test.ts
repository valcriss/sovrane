import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateUserProfileUseCase } from '../../../usecases/user/UpdateUserProfileUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { RealtimePort } from '../../../domain/ports/RealtimePort';

describe('UpdateUserProfileUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let audit: DeepMockProxy<AuditPort>;
  let realtime: DeepMockProxy<RealtimePort>;
  let useCase: UpdateUserProfileUseCase;
  let user: User;
  let role: Role;
  let checker: PermissionChecker;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    audit = mockDeep<AuditPort>();
    realtime = mockDeep<RealtimePort>();
    checker = new PermissionChecker(
      new User(
        'actor',
        'A',
        'B',
        'a@b.c',
        [new Role('admin', 'Admin', [new UserPermissionAssignment(new Permission('p', PermissionKeys.UPDATE_USER, ''))])],
        'active',
        new Department('d', 'Dept', null, null, new Site('s', 'Site')),
        new Site('s', 'Site'),
      ),
    );
    useCase = new UpdateUserProfileUseCase(repository, checker, audit, realtime);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should update user profile via repository', async () => {
    repository.update.mockResolvedValue(user);

    const result = await useCase.execute(user);

    expect(result).toBe(user);
    expect(user.updatedBy).toBe(checker.currentUser);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(repository.update).toHaveBeenCalledWith(user);
    expect(audit.log).toHaveBeenCalled();
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.actorId).toBe(checker.currentUser.id);
    expect(event.targetId).toBe(user.id);
    expect(realtime.broadcast).toHaveBeenCalledWith('user-changed', { id: user.id });
  });

  it('should throw when permission denied', async () => {
    const denied = mockDeep<PermissionChecker>();
    denied.check.mockImplementation(() => { throw new Error('Forbidden'); });
    useCase = new UpdateUserProfileUseCase(repository, denied, audit, realtime);
    await expect(useCase.execute(user)).rejects.toThrow('Forbidden');
    expect(repository.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
