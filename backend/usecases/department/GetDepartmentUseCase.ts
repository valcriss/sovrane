import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving a single department by id.
 */
export class GetDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the department to fetch.
   * @returns The corresponding {@link Department} or `null` if not found.
   */
  async execute(id: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.READ_DEPARTMENT);
    return this.departmentRepository.findById(id);
  }
}
