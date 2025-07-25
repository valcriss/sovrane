import { randomBytes } from 'crypto';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { InvitationRepositoryPort } from '../../domain/ports/InvitationRepositoryPort';
import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { Invitation } from '../../domain/entities/Invitation';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case responsible for creating and sending a user invitation.
 */
export class CreateInvitationUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly invitationRepository: InvitationRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the invitation flow.
   *
   * @param data - Invitation details.
   * @returns The created {@link Invitation}.
   */
  async execute(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<Invitation> {
    this.checker.check(PermissionKeys.CREATE_INVITATION);
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const existingInvitation = await this.invitationRepository.findByEmail(data.email);
    if (existingInvitation) {
      throw new Error('Invitation already exists');
    }

    const token = randomBytes(32).toString('hex');
    const invitation = new Invitation(
      data.email,
      token,
      'pending',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      data.firstName,
      data.lastName,
      data.role,
    );

    await this.invitationRepository.create(invitation);
    await this.emailService.sendMail({
      to: data.email,
      subject: 'Account invitation',
      text: `https://your-app.com/activate?token=${token}`,
    });
    return invitation;
  }
}
