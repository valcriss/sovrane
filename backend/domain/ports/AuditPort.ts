import { AuditEvent } from '../entities/AuditEvent';

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
}
