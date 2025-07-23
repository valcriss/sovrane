import { SiteRepositoryPort } from '../domain/ports/SiteRepositoryPort';
import { Site } from '../domain/entities/Site';

/**
 * Use case responsible for creating a {@link Site}.
 */
export class CreateSiteUseCase {
  constructor(private readonly siteRepository: SiteRepositoryPort) {}

  /**
   * Execute the use case.
   *
   * @param site - The site to persist.
   * @returns The created {@link Site}.
   */
  async execute(site: Site): Promise<Site> {
    return this.siteRepository.create(site);
  }
}
