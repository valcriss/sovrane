import { Site } from '../entities/Site';

/**
 * Defines the contract for site persistence operations.
 */
export interface SiteRepositoryPort {
  /**
   * Find a site by its identifier.
   *
   * @param id - Identifier of the site to locate.
   * @returns The matching {@link Site} or `null` if not found.
   */
  findById(id: string): Promise<Site | null>;

  /**
   * Retrieve all sites.
   *
   * @returns Array of registered {@link Site} instances.
   */
  findAll(): Promise<Site[]>;

  /**
   * Retrieve a site by its label.
   *
   * @param label - Label of the site to search for.
   * @returns The corresponding {@link Site} or `null` if none exists.
   */
  findByLabel(label: string): Promise<Site | null>;

  /**
   * Persist a new site.
   *
   * @param site - Site entity to create.
   * @returns The created {@link Site} entity.
   */
  create(site: Site): Promise<Site>;

  /**
   * Update an existing site.
   *
   * @param site - Updated site entity.
   * @returns The persisted {@link Site} after update.
   */
  update(site: Site): Promise<Site>;

  /**
   * Remove a site by identifier.
   *
   * @param id - Identifier of the site to delete.
   */
  delete(id: string): Promise<void>;
}
