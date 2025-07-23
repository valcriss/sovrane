import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';

/**
 * Use case for deleting a department only when no user is attached to it.
 */
export class DeleteDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Execute the deletion.
   *
   * @param departmentId - Identifier of the department to delete.
   */
  async execute(departmentId: string): Promise<void> {
    const users = await this.userRepository.findByDepartmentId(departmentId);
    if (users.length > 0) {
      throw new Error('Department has attached users');
    }
    await this.departmentRepository.delete(departmentId);
  }
}
