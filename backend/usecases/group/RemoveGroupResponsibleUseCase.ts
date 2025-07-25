/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import type { UserGroup } from '../../domain/entities/UserGroup';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing a responsible user from a group.
 */
export class RemoveGroupResponsibleUseCase {
  constructor(
    private readonly groupRepository: UserGroupRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the removal.
   *
   * @param groupId - Identifier of the group.
   * @param userId - Identifier of the responsible user to remove.
   * @returns The updated {@link UserGroup} or `null` when group or user is missing.
   */
  async execute(groupId: string, userId: string): Promise<UserGroup | null> {
    this.checker.check(PermissionKeys.MANAGE_GROUP_RESPONSIBLES);
    const group = await this.groupRepository.findById(groupId);
    const user = await this.userRepository.findById(userId);
    if (!group || !user) {
      return null;
    }
    return this.groupRepository.removeResponsible(groupId, userId);
  }
}
