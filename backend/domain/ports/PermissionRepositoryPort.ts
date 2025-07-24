import { Permission } from '../entities/Permission';

/**
 * Defines the contract for permission persistence operations.
 */
export interface PermissionRepositoryPort {
  /**
   * Find a permission by its identifier.
   *
   * @param id - Identifier of the permission to locate.
   * @returns The matching {@link Permission} or `null` if not found.
   */
  findById(id: string): Promise<Permission | null>;

  /**
   * Retrieve all permissions.
   *
   * @returns Array of all available {@link Permission} instances.
   */
  findAll(): Promise<Permission[]>;

  /**
   * Retrieve a permission by its key.
   *
   * @param permissionKey - Key of the permission to search for.
   * @returns The corresponding {@link Permission} or `null` if none exists.
   */
  findByKey(permissionKey: string): Promise<Permission | null>;

  /**
   * Persist a new permission.
   *
   * @param permission - Permission entity to create.
   * @returns The created {@link Permission} entity.
   */
  create(permission: Permission): Promise<Permission>;

  /**
   * Update an existing permission.
   *
   * @param permission - Updated permission entity.
   * @returns The persisted {@link Permission} after update.
   */
  update(permission: Permission): Promise<Permission>;

  /**
   * Remove a permission by identifier.
   *
   * @param id - Identifier of the permission to delete.
   */
  delete(id: string): Promise<void>;
}
