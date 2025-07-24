import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

/**
 * Use case for retrieving a site by id.
 */
export class GetSiteUseCase {
  constructor(private readonly siteRepository: SiteRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the site.
   * @returns The corresponding {@link Site} or `null` if not found.
   */
  async execute(id: string): Promise<Site | null> {
    return this.siteRepository.findById(id);
  }
}
