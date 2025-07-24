import { RoleRepositoryPort } from '../../domain/ports/RoleRepositoryPort';
import { Role } from '../../domain/entities/Role';

/**
 * Use case for retrieving a role by id.
 */
export class GetRoleUseCase {
  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the role to fetch.
   * @returns The corresponding {@link Role} or `null` if not found.
   */
  async execute(id: string): Promise<Role | null> {
    return this.roleRepository.findById(id);
  }
}
