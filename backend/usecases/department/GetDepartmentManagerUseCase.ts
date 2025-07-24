import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

/**
 * Use case for retrieving the manager of a department.
 */
export class GetDepartmentManagerUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param departmentId - Identifier of the department.
   * @returns The manager {@link User} or `null` if none found.
   */
  async execute(departmentId: string): Promise<User | null> {
    const department = await this.departmentRepository.findById(departmentId);
    if (!department?.managerUserId) return null;
    return this.userRepository.findById(department.managerUserId);
  }
}
