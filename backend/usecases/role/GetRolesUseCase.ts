import { RoleRepositoryPort, RoleFilters } from '../../domain/ports/RoleRepositoryPort';
import { Role } from '../../domain/entities/Role';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for retrieving all roles.
 */
export class GetRolesUseCase {
  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @returns Array of {@link Role} instances.
   */
  async execute(
    params: ListParams & { filters?: RoleFilters },
  ): Promise<PaginatedResult<Role>> {
    return this.roleRepository.findPage(params);
  }
}
