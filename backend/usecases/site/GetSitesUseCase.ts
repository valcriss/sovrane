import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

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
  async execute(): Promise<Site[]> {
    return this.siteRepository.findAll();
  }
}
