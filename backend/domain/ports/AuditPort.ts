import { AuditEvent } from '../entities/AuditEvent';
import { PaginatedResult } from '../dtos/PaginatedResult';
import { AuditLogQuery } from '../dtos/AuditLogQuery';

/**
 * Provides persistence of {@link AuditEvent} instances for traceability.
 */
export interface AuditPort {
  /**
   * Persist the given audit event.
   *
   * @param event - Event to record.
   */
  log(event: AuditEvent): Promise<void>;

  /**
   * Retrieve audit events matching the provided query.
   *
   * @param query - Pagination and filtering parameters.
   * @returns Page of {@link AuditEvent}.
   */
  findPaginated(query: AuditLogQuery): Promise<PaginatedResult<AuditEvent>>;
}
