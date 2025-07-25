/* istanbul ignore file */
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserGroup } from '../../domain/entities/UserGroup';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for creating a {@link UserGroup}.
 */
export class CreateUserGroupUseCase {
  constructor(
    private readonly repository: UserGroupRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the creation.
   *
   * @param group - Group to persist.
   * @returns The created {@link UserGroup}.
   */
  async execute(group: UserGroup): Promise<UserGroup> {
    this.checker.check(PermissionKeys.CREATE_GROUP);
    return this.repository.create(group);
  }
}
