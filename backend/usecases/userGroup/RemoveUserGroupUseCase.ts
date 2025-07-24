/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';

/**
 * Use case for removing a user group.
 */
export class RemoveUserGroupUseCase {
  constructor(private readonly repository: UserGroupRepositoryPort) {}

  /**
   * Execute the deletion.
   *
   * @param groupId - Identifier of the group to delete.
   */
  async execute(groupId: string): Promise<void> {
    await this.repository.delete(groupId);
  }
}
