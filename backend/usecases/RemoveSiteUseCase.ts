import { SiteRepositoryPort } from '../domain/ports/SiteRepositoryPort';
import { UserRepositoryPort } from '../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../domain/ports/DepartmentRepositoryPort';

/**
 * Use case for removing a site only when no user or department is attached to it.
 */
export class RemoveSiteUseCase {
  constructor(
    private readonly siteRepository: SiteRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  /**
   * Execute the deletion.
   *
   * @param siteId - Identifier of the site to delete.
   */
  async execute(siteId: string): Promise<void> {
    const users = await this.userRepository.findBySiteId(siteId);
    if (users.length > 0) {
      throw new Error('Site has attached users');
    }

    const departments = await this.departmentRepository.findBySiteId(siteId);
    if (departments.length > 0) {
      throw new Error('Site has attached departments');
    }

    await this.siteRepository.delete(siteId);
  }
}
