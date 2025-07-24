import { PermissionRepositoryPort } from '../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../domain/entities/Permission';

/**
 * Use case for retrieving a permission by id.
 */
export class GetPermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the permission to fetch.
   * @returns The corresponding {@link Permission} or `null` if not found.
   */
  async execute(id: string): Promise<Permission | null> {
    return this.permissionRepository.findById(id);
  }
}
