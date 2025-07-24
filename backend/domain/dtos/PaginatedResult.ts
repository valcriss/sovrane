/**
 * Generic result returned when listing entities with pagination.
 */
export interface PaginatedResult<T> {
  /**
   * List of items for the current page.
   */
  items: T[];
  /**
   * Current page number starting at 1.
   */
  page: number;
  /**
   * Number of items requested per page.
   */
  limit: number;
  /**
   * Total number of records matching the query.
   */
  total: number;
}

/**
 * Parameters used to request a paginated list of entities.
 */
export interface ListParams {
  /** Page number starting at 1. */
  page: number;
  /** Number of items per page. */
  limit: number;
  /** Optional filters specific to each entity type. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
}
