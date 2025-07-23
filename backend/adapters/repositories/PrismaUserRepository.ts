import { PrismaClient, User as PrismaUser, Role as PrismaRole, Department as PrismaDepartment, Permission as PrismaPermission, Site as PrismaSite } from '@prisma/client';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';
import { Permission } from '../../domain/entities/Permission';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(
    record: PrismaUser & {
      roles: Array<{ role: PrismaRole }>;
      department: PrismaDepartment & { site: PrismaSite };
      site: PrismaSite;
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
        new Site(record.department.site.id, record.department.site.label),
      ),
      new Site(record.site.id, record.site.label),
      record.picture ?? undefined,
      record.permissions.map((up) =>
        new Permission(up.permission.id, up.permission.permissionKey, up.permission.description),
      ),
    );
  }

  async findById(id: string): Promise<User | null> {
    this.logger.debug('User findById', getContext());
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug('User findByEmail', getContext());
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByExternalAuth(provider: string, externalId: string): Promise<User | null> {
    this.logger.debug('User findByExternalAuth', getContext());
    const record = await this.prisma.user.findFirst({
      where: { 
        externalProvider: provider,
        externalId: externalId
      },
      include: {
        roles: { include: { role: true } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByDepartmentId(departmentId: string): Promise<User[]> {
    this.logger.debug('User findByDepartmentId', getContext());
    const records = await this.prisma.user.findMany({
      where: { departmentId },
      include: {
        roles: { include: { role: true } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  async findByRoleId(roleId: string): Promise<User[]> {
    this.logger.debug('User findByRoleId', getContext());
    const records = await this.prisma.user.findMany({
      where: { roles: { some: { roleId } } },
      include: {
        roles: { include: { role: true } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  async findBySiteId(siteId: string): Promise<User[]> {
    this.logger.debug('User findBySiteId', getContext());
    const records = await this.prisma.user.findMany({
      where: { siteId },
      include: {
        roles: { include: { role: true } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  async create(user: User): Promise<User> {
    this.logger.info('Creating user', getContext());
    const record = await this.prisma.user.create({
      data: {
        id: user.id,
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        password: '',
        status: user.status,
        departmentId: user.department.id,
        siteId: user.site.id,
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
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return this.mapRecord(record);
  }

  async update(user: User): Promise<User> {
    this.logger.info('Updating user', getContext());
    const record = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        status: user.status,
        departmentId: user.department.id,
        siteId: user.site.id,
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
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
      },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting user', getContext());
    await this.prisma.user.delete({ where: { id } });
  }
}
