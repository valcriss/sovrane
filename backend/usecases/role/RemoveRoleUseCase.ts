import { RoleRepositoryPort } from '../../domain/ports/RoleRepositoryPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';

/**
 * Use case for removing a role only when no user currently has it assigned.
 */
export class RemoveRoleUseCase {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Execute the deletion.
   *
   * @param roleId - Identifier of the role to delete.
   */
  async execute(roleId: string): Promise<void> {
    const users = await this.userRepository.findByRoleId(roleId);
    if (users.length > 0) {
      throw new Error('Role is assigned to users');
    }
    await this.roleRepository.delete(roleId);
  }
}
