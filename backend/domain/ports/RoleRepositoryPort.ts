/**
 * Defines the contract for role persistence operations.
 */
import { Role } from '../entities/Role';
import { ListParams, PaginatedResult } from '../dtos/PaginatedResult';

/**
 * Filters used when listing roles.
 */
export interface RoleFilters {
  /** Free text search on the label. */
  search?: string;
}

export interface RoleRepositoryPort {
  /**
   * Find a role by its identifier.
   *
   * @param id - Identifier of the role to locate.
   * @returns The matching {@link Role} or `null` if not found.
   */
  findById(id: string): Promise<Role | null>;

  /**
  * Retrieve all roles.
  *
  * @returns Array of available {@link Role} instances.
  */
  findAll(): Promise<Role[]>;

  /**
   * Retrieve roles with pagination and optional search.
   *
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of roles.
   */
  findPage(params: ListParams & { filters?: RoleFilters }): Promise<PaginatedResult<Role>>;

  /**
   * Retrieve a role by its label.
   *
   * @param label - Label of the role to search for.
   * @returns The corresponding {@link Role} or `null` if none exists.
   */
  findByLabel(label: string): Promise<Role | null>;

  /**
   * Persist a new role.
   *
   * @param role - Role entity to create.
   * @returns The created {@link Role} entity.
   */
  create(role: Role): Promise<Role>;

  /**
   * Update an existing role.
   *
   * @param role - Updated role entity.
   * @returns The persisted {@link Role} after update.
   */
  update(role: Role): Promise<Role>;

  /**
   * Remove a role by identifier.
   *
   * @param id - Identifier of the role to delete.
   */
  delete(id: string): Promise<void>;
}
