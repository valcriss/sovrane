import { PrismaClient, User as PrismaUser, Role as PrismaRole, Department as PrismaDepartment, Permission as PrismaPermission } from '@prisma/client';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Permission } from '../../domain/entities/Permission';

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  private mapRecord(
    record: PrismaUser & {
      roles: Array<{ role: PrismaRole }>;
      department: PrismaDepartment;
      permissions: Array<{ permission: PrismaPermission }>;
    },
  ): User {
    return new User(
      record.id,
      record.firstname,
      record.lastname,
      record.email,
      record.roles.map((ur) => new Role(ur.role.id, ur.role.label)),
      record.status as 'active' | 'suspended' | 'archived',
      new Department(
        record.department.id,
        record.department.label,
        record.department.parentDepartmentId,
        record.department.managerUserId,
      ),
      record.picture ?? undefined,
      record.permissions.map((up) =>
        new Permission(up.permission.id, up.permission.permissionKey, up.permission.description),
      ),
    );
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        department: true,
        permissions: { include: { permission: true } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        department: true,
        permissions: { include: { permission: true } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByExternalAuth(provider: string, externalId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { 
        externalProvider: provider,
        externalId: externalId
      },
      include: {
        roles: { include: { role: true } },
        department: true,
        permissions: { include: { permission: true } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async create(user: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        id: user.id,
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        password: '',
        status: user.status,
        departmentId: user.department.id,
        picture: user.picture,
        permissions: {
          create: user.permissions.map((p) => ({ permission: { connect: { id: p.id } } })),
        },
        roles: {
          create: user.roles.map(r => ({ role: { connect: { id: r.id } } })),
        },
      },
      include: {
        roles: { include: { role: true } },
        department: true,
        permissions: { include: { permission: true } },
      },
    });
    return this.mapRecord(record);
  }

  async update(user: User): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        status: user.status,
        departmentId: user.department.id,
        picture: user.picture,
        permissions: {
          deleteMany: {},
          create: user.permissions.map((p) => ({ permission: { connect: { id: p.id } } })),
        },
        roles: {
          deleteMany: {},
          create: user.roles.map(r => ({ role: { connect: { id: r.id } } })),
        },
      },
      include: {
        roles: { include: { role: true } },
        department: true,
        permissions: { include: { permission: true } },
      },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
