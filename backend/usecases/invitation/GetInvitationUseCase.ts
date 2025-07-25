import { InvitationRepositoryPort } from '../../domain/ports/InvitationRepositoryPort';
import { Invitation } from '../../domain/entities/Invitation';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving an invitation by its token.
 */
export class GetInvitationUseCase {
  constructor(
    private readonly invitationRepository: InvitationRepositoryPort
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param token - Invitation token to look up.
   * @returns The matching {@link Invitation} or `null` if not found or expired.
   */
  async execute(token: string): Promise<Invitation | null> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) {
      return null;
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return invitation;
  }
}
