import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { AuditLogQuery } from '../../domain/dtos/AuditLogQuery';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case retrieving audit log entries.
 */
export class GetAuditLogsUseCase {
  constructor(
    private readonly audit: AuditPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param query - Pagination and filter parameters.
   * @returns Page of {@link AuditEvent} records.
   */
  async execute(query: AuditLogQuery): Promise<PaginatedResult<AuditEvent>> {
    this.checker.check(PermissionKeys.VIEW_AUDIT_LOGS);
    return this.audit.findPaginated(query);
  }
}

