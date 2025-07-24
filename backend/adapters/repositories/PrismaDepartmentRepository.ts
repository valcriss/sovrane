import { PrismaClient, Department as PrismaDepartment, Site as PrismaSite } from '@prisma/client';
import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link DepartmentRepositoryPort}.
 */
export class PrismaDepartmentRepository implements DepartmentRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(record: PrismaDepartment & { site: PrismaSite }): Department {
    return new Department(
      record.id,
      record.label,
      record.parentDepartmentId,
      record.managerUserId,
      new Site(record.site.id, record.site.label),
    );
  }

  async findById(id: string): Promise<Department | null> {
    this.logger.debug('Department findById', getContext());
    const record = await this.prisma.department.findUnique({ where: { id }, include: { site: true } });
    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<Department[]> {
    this.logger.debug('Department findAll', getContext());
    const records = await this.prisma.department.findMany({ include: { site: true } });
    return records.map(r => this.mapRecord(r));
  }

  async findByLabel(label: string): Promise<Department | null> {
    this.logger.debug('Department findByLabel', getContext());
    const record = await this.prisma.department.findFirst({ where: { label }, include: { site: true } });
    return record ? this.mapRecord(record) : null;
  }

  async create(department: Department): Promise<Department> {
    this.logger.info('Creating department', getContext());
    const record = await this.prisma.department.create({
      data: {
        id: department.id,
        label: department.label,
        parentDepartmentId: department.parentDepartmentId,
        managerUserId: department.managerUserId,
        siteId: department.site.id,
      },
      include: { site: true },
    });
    return this.mapRecord(record);
  }

  async update(department: Department): Promise<Department> {
    this.logger.info('Updating department', getContext());
    const record = await this.prisma.department.update({
      where: { id: department.id },
      data: {
        label: department.label,
        parentDepartmentId: department.parentDepartmentId,
        managerUserId: department.managerUserId,
        siteId: department.site.id,
      },
      include: { site: true },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting department', getContext());
    await this.prisma.department.delete({ where: { id } });
  }

  async findBySiteId(siteId: string): Promise<Department[]> {
    this.logger.debug('Department findBySiteId', getContext());
    const records = await this.prisma.department.findMany({
      where: { siteId },
      include: { site: true },
    });
    return records.map(r => this.mapRecord(r));
  }
}
