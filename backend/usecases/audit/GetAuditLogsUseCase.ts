import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { AuditLogQuery } from '../../domain/dtos/AuditLogQuery';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';
import { AuditConfigService } from '../../domain/services/AuditConfigService';

/**
 * Use case retrieving audit log entries.
 */
export class GetAuditLogsUseCase {
  constructor(
    private readonly audit: AuditPort,
    private readonly checker: PermissionChecker,
    private readonly configService: AuditConfigService,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param query - Pagination and filter parameters.
   * @returns Page of {@link AuditEvent} records.
   */
  async execute(query: AuditLogQuery): Promise<PaginatedResult<AuditEvent>> {
    this.checker.check(PermissionKeys.VIEW_AUDIT_LOGS);
    const page = await this.audit.findPaginated(query);
    const config = await this.configService.get();
    if (config) {
      page.items = page.items.filter(ev => {
        const level = ev.details?.level ?? 'info';
        const category = ev.action.split('.')[0];
        const levelMatch =
          config.levels.length === 0 || config.levels.includes(level);
        const categoryMatch =
          config.categories.length === 0 ||
          config.categories.includes(category);
        return levelMatch && categoryMatch;
      });
    }
    return page;
  }
}

