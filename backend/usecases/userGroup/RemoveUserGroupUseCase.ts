/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing a user group.
 */
export class RemoveUserGroupUseCase {
  constructor(
    private readonly repository: UserGroupRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the deletion.
   *
   * @param groupId - Identifier of the group to delete.
   */
  async execute(groupId: string): Promise<void> {
    this.checker.check(PermissionKeys.DELETE_GROUP);
    await this.repository.delete(groupId);
  }
}
