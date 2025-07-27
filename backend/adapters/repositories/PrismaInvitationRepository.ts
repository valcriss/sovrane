/* istanbul ignore file */
import { PrismaClient, Invitation as PrismaInvitation } from '@prisma/client';
import { InvitationRepositoryPort } from '../..//domain/ports/InvitationRepositoryPort';
import { Invitation } from '../../domain/entities/Invitation';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link InvitationRepositoryPort}.
 */
export class PrismaInvitationRepository implements InvitationRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(record: PrismaInvitation): Invitation {
    return new Invitation(
      record.email,
      record.token,
      record.status as 'pending' | 'accepted' | 'expired',
      record.expiresAt,
      record.firstName ?? undefined,
      record.lastName ?? undefined,
      record.role ?? undefined,
      record.createdAt,
      record.updatedAt,
      null,
      null,
    );
  }

  async create(invitation: Invitation): Promise<Invitation> {
    this.logger.info('Creating invitation', getContext());
    const record = await this.prisma.invitation.create({
      data: {
        email: invitation.email,
        token: invitation.token,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        createdById: invitation.createdBy?.id,
        updatedById: invitation.updatedBy?.id,
      },
    });
    return this.mapRecord(record);
  }

  async findByEmail(email: string): Promise<Invitation | null> {
    this.logger.debug('Invitation findByEmail', getContext());
    const record = await this.prisma.invitation.findFirst({ where: { email } });
    return record ? this.mapRecord(record) : null;
  }

  async findByToken(token: string): Promise<Invitation | null> {
    this.logger.debug('Invitation findByToken', getContext());
    const record = await this.prisma.invitation.findUnique({ where: { token } });
    return record ? this.mapRecord(record) : null;
  }
}
