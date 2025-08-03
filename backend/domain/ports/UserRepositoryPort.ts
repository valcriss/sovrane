import { User } from '../entities/User';
import { ListParams, PaginatedResult } from '../dtos/PaginatedResult';

/**
 * Available filters when querying users.
 */
export interface UserFilters {
  /** Free text search across name and email. */
  search?: string;
  /** Filter by user statuses. */
  statuses?: Array<'active' | 'suspended' | 'archived'>;
  /** Restrict to specific departments. */
  departmentIds?: string[];
  /** Restrict to specific sites. */
  siteIds?: string[];
  /** Restrict to users having any of the given roles. */
  roleIds?: string[];
}

/**
 * Defines the contract for user persistence operations.
 */
export interface UserRepositoryPort {
  /**
   * Find a user by its identifier.
   *
   * @param id - Identifier of the user to locate.
   * @returns The matching {@link User} or `null` if not found.
   */
  findById(id: string): Promise<User | null>;

  /**
  * Retrieve all users.
  *
  * @returns Array of every stored {@link User}.
  */
  findAll(): Promise<User[]>;

  /**
   * Retrieve users using pagination and optional filters.
   *
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of {@link User} instances.
   */
  findPage(params: ListParams & { filters?: UserFilters }): Promise<PaginatedResult<User>>;

  /**
   * Retrieve a user by their email address.
   *
   * @param email - Email to search for.
   * @returns The corresponding {@link User} or `null` if none exists.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by their external authentication provider and ID.
   *
   * @param provider - Name of the external authentication provider (e.g., 'google', 'github').
   * @param externalId - Unique identifier from the external provider.
   * @returns The matching {@link User} or `null` if not found.
   */
  findByExternalAuth(provider: string, externalId: string): Promise<User | null>;

  /**
   * Retrieve all users belonging to the specified department.
   *
   * @param departmentId - Identifier of the department.
   * @returns Array of matching {@link User} instances.
   */
  findByDepartmentId(departmentId: string): Promise<User[]>;

  /**
   * Retrieve all users assigned to the specified role.
   *
   * @param roleId - Identifier of the role.
   * @returns Array of matching {@link User} instances.
   */
  findByRoleId(roleId: string): Promise<User[]>;

  /**
   * Retrieve all users located at the specified site.
   *
   * @param siteId - Identifier of the site.
   * @returns Array of matching {@link User} instances.
   */
  findBySiteId(siteId: string): Promise<User[]>;

  /**
   * Retrieve users having changed their password before the given date.
   *
   * @param date - Latest allowed password change timestamp.
   * @returns Array of matching {@link User} instances.
   */
  findUsersWithPasswordChangedBefore(date: Date): Promise<User[]>;

  /**
   * Persist a new user.
   *
   * @param user - User entity to create.
   * @returns The created {@link User} entity.
   */
  create(user: User): Promise<User>;

  /**
   * Update an existing user.
   *
   * @param user - Updated user entity.
   * @returns The persisted {@link User} after update.
   */
  update(user: User): Promise<User>;

  /**
   * Remove a user by identifier.
   *
   * @param id - Identifier of the user to delete.
   */
  delete(id: string): Promise<void>;
}

