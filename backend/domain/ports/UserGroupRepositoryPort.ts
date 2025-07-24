import { UserGroup } from '../entities/UserGroup';
import { ListParams, PaginatedResult } from '../dtos/PaginatedResult';

/**
 * Filters for listing user groups.
 */
export interface UserGroupFilters {
  /** Free text search on group name. */
  search?: string;
}

/**
 * Contract for user group persistence operations.
 */
export interface UserGroupRepositoryPort {
  /**
   * Find a group by id.
   *
   * @param id - Identifier of the group.
   * @returns The matching {@link UserGroup} or `null` if not found.
   */
  findById(id: string): Promise<UserGroup | null>;

  /**
  * Retrieve all user groups.
  *
  * @returns Array of {@link UserGroup} instances.
  */
  findAll(): Promise<UserGroup[]>;

  /**
   * Retrieve user groups using pagination and optional filters.
   *
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of user groups.
   */
  findPage(params: ListParams & { filters?: UserGroupFilters }): Promise<PaginatedResult<UserGroup>>;

  /**
   * Persist a new group.
   *
   * @param group - Group entity to create.
   * @returns The created {@link UserGroup}.
   */
  create(group: UserGroup): Promise<UserGroup>;

  /**
   * Update an existing group.
   *
   * @param group - Updated group entity.
   * @returns The persisted {@link UserGroup}.
   */
  update(group: UserGroup): Promise<UserGroup>;

  /**
   * Remove a group by identifier.
   *
   * @param id - Identifier of the group to delete.
   */
  delete(id: string): Promise<void>;

  /**
   * Add a user to the group.
   *
   * @param groupId - Identifier of the group.
   * @param userId - Identifier of the user to add.
   * @returns The updated {@link UserGroup} or `null` if not found.
   */
  addUser(groupId: string, userId: string): Promise<UserGroup | null>;

  /**
   * Remove a user from the group.
   *
   * @param groupId - Identifier of the group.
   * @param userId - Identifier of the user to remove.
   * @returns The updated {@link UserGroup} or `null` if not found.
   */
  removeUser(groupId: string, userId: string): Promise<UserGroup | null>;
}
