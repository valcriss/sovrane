import { PrismaClient, Department as PrismaDepartment } from '@prisma/client';
import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';

/**
 * Prisma-based implementation of {@link DepartmentRepositoryPort}.
 */
export class PrismaDepartmentRepository implements DepartmentRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  private mapRecord(record: PrismaDepartment): Department {
    return new Department(
      record.id,
      record.label,
      record.parentDepartmentId,
      record.managerUserId,
    );
  }

  async findById(id: string): Promise<Department | null> {
    const record = await this.prisma.department.findUnique({ where: { id } });
    return record ? this.mapRecord(record) : null;
  }

  async findByLabel(label: string): Promise<Department | null> {
    const record = await this.prisma.department.findFirst({ where: { label } });
    return record ? this.mapRecord(record) : null;
  }

  async create(department: Department): Promise<Department> {
    const record = await this.prisma.department.create({
      data: {
        id: department.id,
        label: department.label,
        parentDepartmentId: department.parentDepartmentId,
        managerUserId: department.managerUserId,
      },
    });
    return this.mapRecord(record);
  }

  async update(department: Department): Promise<Department> {
    const record = await this.prisma.department.update({
      where: { id: department.id },
      data: {
        label: department.label,
        parentDepartmentId: department.parentDepartmentId,
        managerUserId: department.managerUserId,
      },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.department.delete({ where: { id } });
  }
}
