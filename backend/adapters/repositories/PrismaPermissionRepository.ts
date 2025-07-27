/* istanbul ignore file */
import { PrismaClient, Prisma, Permission as PrismaPermission } from '@prisma/client';
import { Permission } from '../../domain/entities/Permission';
import {
  PermissionRepositoryPort,
  PermissionFilters,
} from '../../domain/ports/PermissionRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link PermissionRepositoryPort}.
 */
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(record: PrismaPermission): Permission {
    return new Permission(
      record.id,
      record.permissionKey,
      record.description,
      record.createdAt,
      record.updatedAt,
      null,
      null,
    );
  }

  async findById(id: string): Promise<Permission | null> {
    this.logger.debug('Permission findById', getContext());
    const record = await this.prisma.permission.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<Permission[]> {
    this.logger.debug('Permission findAll', getContext());
    const records = await this.prisma.permission.findMany();
    return records.map(r => this.mapRecord(r));
  }

  /* istanbul ignore next */
  async findPage(
    params: ListParams & { filters?: PermissionFilters },
  ): Promise<PaginatedResult<Permission>> {
    this.logger.debug('Permission findPage', getContext());
    const where: Prisma.PermissionWhereInput = {};
    if (params.filters?.search) {
      where.OR = [
        { permissionKey: { contains: params.filters.search, mode: 'insensitive' } },
        { description: { contains: params.filters.search, mode: 'insensitive' } },
      ];
    }
    const records = await this.prisma.permission.findMany({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
    });
    const total = await this.prisma.permission.count({ where });
    return {
      items: records.map((r) => this.mapRecord(r)),
      page: params.page,
      limit: params.limit,
      total,
    };
  }

  async findByKey(permissionKey: string): Promise<Permission | null> {
    this.logger.debug('Permission findByKey', getContext());
    const record = await this.prisma.permission.findFirst({ where: { permissionKey } });
    return record ? this.mapRecord(record) : null;
  }

  async create(permission: Permission): Promise<Permission> {
    this.logger.info('Creating permission', getContext());
    const record = await this.prisma.permission.create({
      data: {
        id: permission.id,
        permissionKey: permission.permissionKey,
        description: permission.description,
        createdById: permission.createdBy?.id,
        updatedById: permission.updatedBy?.id,
      },
    });
    return this.mapRecord(record);
  }

  async update(permission: Permission): Promise<Permission> {
    this.logger.info('Updating permission', getContext());
    const record = await this.prisma.permission.update({
      where: { id: permission.id },
      data: {
        permissionKey: permission.permissionKey,
        description: permission.description,
        updatedById: permission.updatedBy?.id,
      },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting permission', getContext());
    await this.prisma.permission.delete({ where: { id } });
  }
}
