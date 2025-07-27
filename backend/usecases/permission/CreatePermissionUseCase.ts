import { PermissionRepositoryPort } from '../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../domain/entities/Permission';

/**
 * Use case responsible for creating a {@link Permission}.
 */
export class CreatePermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {}

  /**
   * Execute the use case.
   *
   * @param permission - The permission to persist.
   * @returns The created {@link Permission}.
   */
  async execute(permission: Permission): Promise<Permission> {
    const now = new Date();
    permission.createdAt = now;
    permission.updatedAt = now;
    permission.createdBy = null;
    permission.updatedBy = null;
    return this.permissionRepository.create(permission);
  }
}
