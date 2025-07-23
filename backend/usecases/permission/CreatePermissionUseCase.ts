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
    return this.permissionRepository.create(permission);
  }
}
