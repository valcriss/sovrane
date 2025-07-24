/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../domain/entities/UserGroup';

/**
 * Use case for updating a {@link UserGroup}.
 */
export class UpdateUserGroupUseCase {
  constructor(private readonly repository: UserGroupRepositoryPort) {}

  /**
   * Execute the update.
   *
   * @param group - Updated group entity.
   * @returns The persisted {@link UserGroup}.
   */
  async execute(group: UserGroup): Promise<UserGroup> {
    return this.repository.update(group);
  }
}
