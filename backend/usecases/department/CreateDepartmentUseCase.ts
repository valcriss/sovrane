import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';
import { RealtimePort } from '../../domain/ports/RealtimePort';

/**
 * Use case responsible for creating a {@link Department}.
 */
export class CreateDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
    private readonly realtime: RealtimePort,
  ) {}

  /**
   * Execute the use case.
   *
   * @param department - The department to persist.
   * @returns The created {@link Department}.
   */
  async execute(department: Department): Promise<Department> {
    this.checker.check(PermissionKeys.CREATE_DEPARTMENT);
    const now = new Date();
    department.createdAt = now;
    department.updatedAt = now;
    department.createdBy = this.checker.currentUser;
    department.updatedBy = this.checker.currentUser;
    const created = await this.departmentRepository.create(department);
    await this.realtime.broadcast('department-changed', { id: created.id });
    return created;
  }
}
