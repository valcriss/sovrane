/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../domain/entities/UserGroup';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for updating a {@link UserGroup}.
 */
export class UpdateUserGroupUseCase {
  constructor(
    private readonly repository: UserGroupRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the update.
   *
   * @param group - Updated group entity.
   * @returns The persisted {@link UserGroup}.
   */
  async execute(group: UserGroup): Promise<UserGroup> {
    this.checker.check(PermissionKeys.UPDATE_GROUP);
    return this.repository.update(group);
  }
}
