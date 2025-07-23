import { PrismaClient, Site as PrismaSite } from '@prisma/client';
import { Site } from '../../domain/entities/Site';
import { SiteRepositoryPort } from '../../domain/ports/SiteRepositoryPort';

/**
 * Prisma-based implementation of {@link SiteRepositoryPort}.
 */
export class PrismaSiteRepository implements SiteRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  private mapRecord(record: PrismaSite): Site {
    return new Site(record.id, record.label);
  }

  async findById(id: string): Promise<Site | null> {
    const record = await this.prisma.site.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findByLabel(label: string): Promise<Site | null> {
    const record = await this.prisma.site.findFirst({ where: { label } });
    return record ? this.mapRecord(record) : null;
  }

  async create(site: Site): Promise<Site> {
    const record = await this.prisma.site.create({
      data: { id: site.id, label: site.label },
    });
    return this.mapRecord(record);
  }

  async update(site: Site): Promise<Site> {
    const record = await this.prisma.site.update({
      where: { id: site.id },
      data: { label: site.label },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.site.delete({ where: { id } });
  }
}
