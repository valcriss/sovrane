/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import type { UserGroup } from '../../domain/entities/UserGroup';

/**
 * Use case for adding a responsible user to a group.
 */
export class AddGroupResponsibleUseCase {
  constructor(
    private readonly groupRepository: UserGroupRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Execute the association.
   *
   * @param groupId - Identifier of the group.
   * @param userId - Identifier of the user to add as responsible.
   * @returns The updated {@link UserGroup} or `null` when group or user is missing.
   */
  async execute(groupId: string, userId: string): Promise<UserGroup | null> {
    const group = await this.groupRepository.findById(groupId);
    const user = await this.userRepository.findById(userId);
    if (!group || !user) {
      return null;
    }
    return this.groupRepository.addResponsible(groupId, userId);
  }
}
