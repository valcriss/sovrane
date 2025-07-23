import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { User } from '../../domain/entities/User';

/**
 * Use case for adding a user to a department.
 */
export class AddDepartmentUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  /**
   * Execute the association.
   *
   * @param userId - Identifier of the user to update.
   * @param departmentId - Identifier of the department to assign.
   * @returns The updated {@link User} or `null` if the user or department is missing.
   */
  async execute(userId: string, departmentId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    const department = await this.departmentRepository.findById(departmentId);
    if (!user || !department) {
      return null;
    }
    user.department = department;
    return this.userRepository.update(user);
  }
}
