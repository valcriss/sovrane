import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';
import { Site } from '../../domain/entities/Site';

/**
 * Use case responsible for updating an existing {@link Site}.
 */
export class UpdateSiteUseCase {
  constructor(private readonly siteRepository: SiteRepositoryPort) {}

  /**
   * Execute the update.
   *
   * @param site - Updated site entity.
   * @returns The persisted {@link Site} after update.
   */
  async execute(site: Site): Promise<Site> {
    return this.siteRepository.update(site);
  }
}
