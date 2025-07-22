import { User } from '../entities/User';

/**
 * Defines the contract for user persistence operations.
 */
export interface UserRepositoryPort {
  /**
   * Find a user by its identifier.
   *
   * @param id - Identifier of the user to locate.
   * @returns The matching {@link User} or `null` if not found.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Retrieve a user by their email address.
   *
   * @param email - Email to search for.
   * @returns The corresponding {@link User} or `null` if none exists.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Persist a new user.
   *
   * @param user - User entity to create.
   * @returns The created {@link User} entity.
   */
  create(user: User): Promise<User>;

  /**
   * Update an existing user.
   *
   * @param user - Updated user entity.
   * @returns The persisted {@link User} after update.
   */
  update(user: User): Promise<User>;

  /**
   * Remove a user by identifier.
   *
   * @param id - Identifier of the user to delete.
   */
  delete(id: string): Promise<void>;
}

