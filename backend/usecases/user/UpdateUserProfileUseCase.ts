import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';
import { RealtimePort } from '../../domain/ports/RealtimePort';

/**
 * Use case for updating user profile information.
 */
export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
    private readonly auditPort: AuditPort,
    private readonly realtime: RealtimePort,
  ) {}

  /**
   * Execute the profile update.
   *
   * @param user - Updated user entity.
   * @returns The persisted {@link User} after update.
   */
  async execute(user: User): Promise<User> {
    this.checker.check(PermissionKeys.UPDATE_USER);
    user.updatedAt = new Date();
    user.updatedBy = this.checker.currentUser;
    const updated = await this.userRepository.update(user);
    await this.auditPort.log(
      new AuditEvent(
        new Date(),
        this.checker.currentUser.id,
        'user',
        AuditEventType.USER_PROFILE_UPDATED,
        'user',
        user.id,
        { userId: user.id },
      ),
    );
    await this.realtime.broadcast('user-changed', { id: updated.id });
    return updated;
  }
}
