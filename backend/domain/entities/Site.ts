/**
 * Represents a physical site where users and departments are located.
 */
export class Site {
  /**
   * Create a new {@link Site} instance.
   *
   * @param id - Unique identifier of the site.
   * @param label - Human readable label of the site.
   */
  constructor(
    public readonly id: string,
    public label: string,
  ) {}
}
