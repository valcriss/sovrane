import { Invitation } from '../entities/Invitation';

/**
 * Defines the contract for invitation persistence operations.
 */
export interface InvitationRepositoryPort {
  /**
   * Persist a new invitation.
   *
   * @param invitation - Invitation to create.
   * @returns The created {@link Invitation}.
   */
  create(invitation: Invitation): Promise<Invitation>;

  /**
   * Find an invitation by email address.
   *
   * @param email - Email to search for.
   * @returns The matching {@link Invitation} or `null` if not found.
   */
  findByEmail(email: string): Promise<Invitation | null>;

  /**
   * Find an invitation by its token.
   *
   * @param token - Invitation token to search for.
   * @returns The corresponding {@link Invitation} or `null` if not found.
   */
  findByToken(token: string): Promise<Invitation | null>;
}
