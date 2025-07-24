import { Department } from '../entities/Department';

/**
 * Defines the contract for department persistence operations.
 */
export interface DepartmentRepositoryPort {
  /**
   * Find a department by its identifier.
   *
   * @param id - Identifier of the department to locate.
   * @returns The matching {@link Department} or `null` if not found.
   */
  findById(id: string): Promise<Department | null>;

  /**
   * Retrieve all departments.
   *
   * @returns Array of all {@link Department} instances.
   */
  findAll(): Promise<Department[]>;

  /**
   * Retrieve a department by its label.
   *
   * @param label - Label of the department to search for.
   * @returns The corresponding {@link Department} or `null` if none exists.
   */
  findByLabel(label: string): Promise<Department | null>;

  /**
   * Persist a new department.
   *
   * @param department - Department entity to create.
   * @returns The created {@link Department} entity.
   */
  create(department: Department): Promise<Department>;

  /**
   * Update an existing department.
   *
   * @param department - Updated department entity.
   * @returns The persisted {@link Department} after update.
   */
  update(department: Department): Promise<Department>;

  /**
   * Remove a department by identifier.
   *
   * @param id - Identifier of the department to delete.
   */
  delete(id: string): Promise<void>;

  /**
   * Retrieve all departments located at the specified site.
   *
   * @param siteId - Identifier of the site.
   * @returns Array of matching {@link Department} instances.
   */
  findBySiteId(siteId: string): Promise<Department[]>;
}
