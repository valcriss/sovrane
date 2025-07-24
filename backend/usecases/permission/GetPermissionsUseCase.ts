import { PermissionRepositoryPort } from '../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../domain/entities/Permission';

/**
 * Use case for listing all permissions.
 */
export class GetPermissionsUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @returns Array of {@link Permission} instances.
   */
  async execute(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }
}
