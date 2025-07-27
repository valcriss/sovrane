import { User } from './User';

/**
 * Represents a physical site where users and departments are located.
 */
export class Site {
  /**
   * Create a new {@link Site} instance.
   *
   * @param id - Unique identifier of the site.
   * @param label - Human readable label of the site.
   * @param createdAt - Date when the site was created.
   * @param updatedAt - Date when the site was last updated. Defaults to {@link createdAt}.
   * @param createdBy - User who created the site or `null` if created automatically.
   * @param updatedBy - User who last updated the site or `null` if updated automatically.
   */
  constructor(
    public readonly id: string,
    public label: string,
    /** Date when the site was created. */
    public createdAt: Date = new Date(),
    /** Date when the site was last updated. Defaults to {@link createdAt}. */
    public updatedAt: Date = createdAt,
    /** User that created the site or `null` when created automatically. */
    public createdBy: User | null = null,
    /** User that last updated the site or `null` when updated automatically. */
    public updatedBy: User | null = createdBy,
  ) {}
}
