/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../domain/entities/UserGroup';

/**
 * Use case for creating a {@link UserGroup}.
 */
export class CreateUserGroupUseCase {
  constructor(private readonly repository: UserGroupRepositoryPort) {}

  /**
   * Execute the creation.
   *
   * @param group - Group to persist.
   * @returns The created {@link UserGroup}.
   */
  async execute(group: UserGroup): Promise<UserGroup> {
    return this.repository.create(group);
  }
}
