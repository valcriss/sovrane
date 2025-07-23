import { Role } from './Role';
import { Department } from './Department';
import { Permission } from './Permission';

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
   * @param department - {@link Department} the user belongs to.
   * @param picture - Optional profile picture URL.
   * @param permissions - Collection of {@link Permission} granted directly to the user.
  */
  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public roles: Role[] = [],
    public status: 'active' | 'suspended' | 'archived' = 'active',
    public department: Department,
    public picture?: string,
    public permissions: Permission[] = [],
  ) {}
}

