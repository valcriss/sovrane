import { RoleRepositoryPort } from '../../domain/ports/RoleRepositoryPort';
import { Role } from '../../domain/entities/Role';

/**
 * Use case responsible for updating an existing {@link Role}.
 */
export class UpdateRoleUseCase {
  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  /**
   * Execute the update.
   *
   * @param role - Updated role entity.
   * @returns The persisted {@link Role} after update.
   */
  async execute(role: Role): Promise<Role> {
    role.updatedAt = new Date();
    role.updatedBy = null;
    return this.roleRepository.update(role);
  }
}
