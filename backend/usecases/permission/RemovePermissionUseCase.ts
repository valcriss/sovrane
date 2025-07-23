import { PermissionRepositoryPort } from '../../domain/ports/PermissionRepositoryPort';

/**
 * Use case for removing a permission and all related records.
 */
export class RemovePermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {}

  /**
   * Execute the removal.
   *
   * @param permissionId - Identifier of the permission to delete.
   */
  async execute(permissionId: string): Promise<void> {
    await this.permissionRepository.delete(permissionId);
  }
}
