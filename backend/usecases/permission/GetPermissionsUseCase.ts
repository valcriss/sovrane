import {
  PermissionRepositoryPort,
  PermissionFilters,
} from '../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../domain/entities/Permission';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

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
  async execute(
    params: ListParams & { filters?: PermissionFilters },
  ): Promise<PaginatedResult<Permission>> {
    return this.permissionRepository.findPage(params);
  }
}
