import { PermissionRepositoryPort } from '../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../domain/entities/Permission';

/**
 * Use case responsible for updating an existing {@link Permission}.
 */
export class UpdatePermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {}

  /**
   * Execute the update.
   *
   * @param permission - Updated permission entity.
   * @returns The persisted {@link Permission} after update.
   */
  async execute(permission: Permission): Promise<Permission> {
    return this.permissionRepository.update(permission);
  }
}
