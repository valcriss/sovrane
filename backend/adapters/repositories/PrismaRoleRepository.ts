import { PrismaClient, Role as PrismaRole } from '@prisma/client';
import { RoleRepositoryPort } from '../../domain/ports/RoleRepositoryPort';
import { Role } from '../../domain/entities/Role';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link RoleRepositoryPort}.
 */
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(record: PrismaRole): Role {
    return new Role(record.id, record.label);
  }

  async findById(id: string): Promise<Role | null> {
    this.logger.debug('Role findById', getContext());
    const record = await this.prisma.role.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findByLabel(label: string): Promise<Role | null> {
    this.logger.debug('Role findByLabel', getContext());
    const record = await this.prisma.role.findFirst({ where: { label } });
    return record ? this.mapRecord(record) : null;
  }

  async create(role: Role): Promise<Role> {
    this.logger.info('Creating role', getContext());
    const record = await this.prisma.role.create({
      data: { id: role.id, label: role.label },
    });
    return this.mapRecord(record);
  }

  async update(role: Role): Promise<Role> {
    this.logger.info('Updating role', getContext());
    const record = await this.prisma.role.update({
      where: { id: role.id },
      data: { label: role.label },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting role', getContext());
    await this.prisma.role.delete({ where: { id } });
  }
}
