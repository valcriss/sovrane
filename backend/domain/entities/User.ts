import { Role } from './Role';

/**
 * Represents a user within the system.
 */
export class User {
  /**
   * Create a new {@link User}.
   *
   * @param id - Unique identifier of the user.
   * @param firstName - User's given name.
   * @param lastName - User's family name.
   * @param email - Email address used to contact the user.
   * @param roles - Collection of {@link Role} instances assigned to the user.
   * @param status - Current account status.
   * @param departmentId - Identifier of the department the user belongs to.
   */
  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public roles: Role[] = [],
    public status: 'active' | 'suspended' | 'archived' = 'active',
    public departmentId: string,
  ) {}
}

