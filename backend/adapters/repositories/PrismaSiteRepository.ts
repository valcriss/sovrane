/* istanbul ignore file */
import { PrismaClient, Prisma, Site as PrismaSite } from '@prisma/client';
import { Site } from '../../domain/entities/Site';
import { SiteRepositoryPort, SiteFilters } from '../../domain/ports/SiteRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Prisma-based implementation of {@link SiteRepositoryPort}.
 */
export class PrismaSiteRepository implements SiteRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(record: PrismaSite): Site {
    return new Site(record.id, record.label);
  }

  async findById(id: string): Promise<Site | null> {
    this.logger.debug('Site findById', getContext());
    const record = await this.prisma.site.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<Site[]> {
    this.logger.debug('Site findAll', getContext());
    const records = await this.prisma.site.findMany();
    return records.map(r => this.mapRecord(r));
  }

  /* istanbul ignore next */
  async findPage(
    params: ListParams & { filters?: SiteFilters },
  ): Promise<PaginatedResult<Site>> {
    this.logger.debug('Site findPage', getContext());
    const where: Prisma.SiteWhereInput = {};
    if (params.filters?.search) {
      where.label = { contains: params.filters.search, mode: 'insensitive' };
    }
    const records = await this.prisma.site.findMany({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
    });
    const total = await this.prisma.site.count({ where });
    return { items: records.map((r) => this.mapRecord(r)), page: params.page, limit: params.limit, total };
  }

  async findByLabel(label: string): Promise<Site | null> {
    this.logger.debug('Site findByLabel', getContext());
    const record = await this.prisma.site.findFirst({ where: { label } });
    return record ? this.mapRecord(record) : null;
  }

  async create(site: Site): Promise<Site> {
    this.logger.info('Creating site', getContext());
    const record = await this.prisma.site.create({
      data: { id: site.id, label: site.label },
    });
    return this.mapRecord(record);
  }

  async update(site: Site): Promise<Site> {
    this.logger.info('Updating site', getContext());
    const record = await this.prisma.site.update({
      where: { id: site.id },
      data: { label: site.label },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting site', getContext());
    await this.prisma.site.delete({ where: { id } });
  }
}
