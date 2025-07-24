import { RoleRepositoryPort } from '../../domain/ports/RoleRepositoryPort';
import { Role } from '../../domain/entities/Role';

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
  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}
