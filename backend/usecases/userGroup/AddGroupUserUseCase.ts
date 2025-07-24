/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import type { UserGroup } from '../../domain/entities/UserGroup';

/**
 * Use case for adding a user to a group.
 */
export class AddGroupUserUseCase {
  constructor(
    private readonly groupRepository: UserGroupRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Execute the association.
   *
   * @param groupId - Identifier of the group.
   * @param userId - Identifier of the user to add.
   * @returns The updated {@link UserGroup} or `null` when group or user is missing.
   */
  async execute(groupId: string, userId: string): Promise<UserGroup | null> {
    const group = await this.groupRepository.findById(groupId);
    const user = await this.userRepository.findById(userId);
    if (!group || !user) {
      return null;
    }
    group.members.push(user);
    return this.groupRepository.addUser(groupId, userId);
  }
}
