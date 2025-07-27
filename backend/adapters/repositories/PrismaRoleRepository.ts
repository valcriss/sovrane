/* istanbul ignore file */
import { PrismaClient, Prisma, Role as PrismaRole } from '@prisma/client';
import { RoleRepositoryPort, RoleFilters } from '../../domain/ports/RoleRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
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
    return new Role(
      record.id,
      record.label,
      [],
      record.createdAt,
      record.updatedAt,
      null,
      null,
    );
  }

  async findById(id: string): Promise<Role | null> {
    this.logger.debug('Role findById', getContext());
    const record = await this.prisma.role.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<Role[]> {
    this.logger.debug('Role findAll', getContext());
    const records = await this.prisma.role.findMany();
    return records.map(r => this.mapRecord(r));
  }

  /* istanbul ignore next */
  async findPage(
    params: ListParams & { filters?: RoleFilters },
  ): Promise<PaginatedResult<Role>> {
    this.logger.debug('Role findPage', getContext());
    const where: Prisma.RoleWhereInput = {};
    if (params.filters?.search) {
      where.label = { contains: params.filters.search, mode: 'insensitive' };
    }
    const records = await this.prisma.role.findMany({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
    });
    const total = await this.prisma.role.count({ where });
    return {
      items: records.map((r) => this.mapRecord(r)),
      page: params.page,
      limit: params.limit,
      total,
    };
  }

  async findByLabel(label: string): Promise<Role | null> {
    this.logger.debug('Role findByLabel', getContext());
    const record = await this.prisma.role.findFirst({ where: { label } });
    return record ? this.mapRecord(record) : null;
  }

  async create(role: Role): Promise<Role> {
    this.logger.info('Creating role', getContext());
    const record = await this.prisma.role.create({
      data: {
        id: role.id,
        label: role.label,
        createdById: role.createdBy?.id,
        updatedById: role.updatedBy?.id,
      },
    });
    return this.mapRecord(record);
  }

  async update(role: Role): Promise<Role> {
    this.logger.info('Updating role', getContext());
    const record = await this.prisma.role.update({
      where: { id: role.id },
      data: { label: role.label, updatedById: role.updatedBy?.id },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting role', getContext());
    await this.prisma.role.delete({ where: { id } });
  }
}
