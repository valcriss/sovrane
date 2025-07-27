/**
 * Parameters used to retrieve a page of audit log entries.
 */
export interface AuditLogQuery {
  /** Page number starting at 1. */
  page: number;
  /** Number of items per page. */
  limit: number;
  /** Optional identifier of the actor who triggered the event. */
  actorId?: string;
  /** Optional action name to filter on. */
  action?: string;
  /** Optional type of the target entity. */
  targetType?: string;
  /** Optional lower bound on the event timestamp. */
  dateFrom?: Date;
  /** Optional upper bound on the event timestamp. */
  dateTo?: Date;
}

