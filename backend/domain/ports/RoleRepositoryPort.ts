/**
 * Defines the contract for role persistence operations.
 */
import { Role } from '../entities/Role';

export interface RoleRepositoryPort {
  /**
   * Find a role by its identifier.
   *
   * @param id - Identifier of the role to locate.
   * @returns The matching {@link Role} or `null` if not found.
   */
  findById(id: string): Promise<Role | null>;

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
