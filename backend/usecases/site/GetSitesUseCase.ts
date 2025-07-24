import { SiteRepositoryPort, SiteFilters } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for listing all sites.
 */
export class GetSitesUseCase {
  constructor(private readonly siteRepository: SiteRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @returns Array of {@link Site} instances.
   */
  async execute(
    params: ListParams & { filters?: SiteFilters },
  ): Promise<PaginatedResult<Site>> {
    return this.siteRepository.findPage(params);
  }
}
