import { PrismaClient } from '@prisma/client';
import { Permission } from '../../domain/entities/Permission';
import { PermissionRepositoryPort } from '../../domain/ports/PermissionRepositoryPort';

/**
 * Prisma-based implementation of {@link PermissionRepositoryPort}.
 */
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  private mapRecord(record: any): Permission {
    return new Permission(record.id, record.permissionKey, record.description);
  }

  async findById(id: string): Promise<Permission | null> {
    const record = await (this.prisma as any).permission.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findByKey(permissionKey: string): Promise<Permission | null> {
    const record = await (this.prisma as any).permission.findFirst({ where: { permissionKey } });
    return record ? this.mapRecord(record) : null;
  }

  async create(permission: Permission): Promise<Permission> {
    const record = await (this.prisma as any).permission.create({
      data: { id: permission.id, permissionKey: permission.permissionKey, description: permission.description },
    });
    return this.mapRecord(record);
  }

  async update(permission: Permission): Promise<Permission> {
    const record = await (this.prisma as any).permission.update({
      where: { id: permission.id },
      data: { permissionKey: permission.permissionKey, description: permission.description },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).permission.delete({ where: { id } });
  }
}
