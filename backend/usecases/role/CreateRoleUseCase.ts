import { RoleRepositoryPort } from '../../domain/ports/RoleRepositoryPort';
import { Role } from '../../domain/entities/Role';

/**
 * Use case responsible for creating a {@link Role}.
 */
export class CreateRoleUseCase {
  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  /**
   * Execute the use case.
   *
   * @param role - The role to persist.
   * @returns The created {@link Role}.
   */
  async execute(role: Role): Promise<Role> {
    return this.roleRepository.create(role);
  }
}
