/* istanbul ignore file */
import {
  PrismaClient,
  Prisma,
  User as PrismaUser,
  Role as PrismaRole,
  Department as PrismaDepartment,
  Permission as PrismaPermission,
  Site as PrismaSite,
} from '@prisma/client';
import { UserRepositoryPort, UserFilters } from '../../domain/ports/UserRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';
import { Permission } from '../../domain/entities/Permission';
import { UserPermissionAssignment } from '../../domain/entities/UserPermissionAssignment';
import { RolePermissionAssignment } from '../../domain/entities/RolePermissionAssignment';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(
    private prisma: PrismaClient,
    private readonly logger: LoggerPort,
  ) {}

  private mapRecord(
    record: PrismaUser & {
      roles: Array<{
        role: PrismaRole & {
          permissions: Array<{ permission: PrismaPermission; scopeId: string | null }>;
        };
      }>;
      department: PrismaDepartment & { site: PrismaSite };
      site: PrismaSite;
      permissions: Array<{ permission: PrismaPermission; scopeId: string | null; denyPermission: boolean }>;
      mfaEnabled: boolean | null;
      mfaType: string | null;
      mfaSecret: string | null;
      mfaRecoveryCodes: Prisma.JsonValue | null;
    },
  ): User {
    return new User(
      record.id,
      record.firstname,
      record.lastname,
      record.email,
      record.roles.map(
        (ur) =>
          new Role(
            ur.role.id,
            ur.role.label,
            ur.role.permissions.map(
              (rp) =>
                new RolePermissionAssignment(
                  new Permission(
                    rp.permission.id,
                    rp.permission.permissionKey,
                    rp.permission.description,
                  ),
                  rp.scopeId ?? undefined,
                ),
            ),
          ),
      ),
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
      record.permissions.map(
        (up) =>
          new UserPermissionAssignment(
            new Permission(up.permission.id, up.permission.permissionKey, up.permission.description),
            up.scopeId ?? undefined,
            up.denyPermission,
          ),
      ),
      record.lastLogin ?? null,
      record.lastActivity ?? null,
      record.failedLoginAttempts,
      record.lastFailedLoginAt ?? null,
      record.lockedUntil ?? null,
      record.passwordChangedAt,
      record.createdAt,
      record.updatedAt,
      null,
      null,
      record.mfaEnabled ?? false,
      record.mfaType ?? null,
      record.mfaSecret ?? null,
      (record.mfaRecoveryCodes as string[] ?? []),
    );
  }

  async findById(id: string): Promise<User | null> {
    this.logger.debug('User findById', getContext());
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<User[]> {
    this.logger.debug('User findAll', getContext());
    const records = await this.prisma.user.findMany({
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  /* istanbul ignore next */
  async findPage(
    params: ListParams & { filters?: UserFilters },
  ): Promise<PaginatedResult<User>> {
    this.logger.debug('User findPage', getContext());
    const where: Prisma.UserWhereInput = {};
    if (params.filters?.search) {
      where.OR = [
        { firstname: { contains: params.filters.search, mode: 'insensitive' } },
        { lastname: { contains: params.filters.search, mode: 'insensitive' } },
        { email: { contains: params.filters.search, mode: 'insensitive' } },
      ];
    }
    if (params.filters?.statuses && params.filters.statuses.length > 0) {
      where.status = { in: params.filters.statuses };
    }
    if (params.filters?.departmentIds && params.filters.departmentIds.length > 0) {
      where.departmentId = { in: params.filters.departmentIds };
    }
    if (params.filters?.siteIds && params.filters.siteIds.length > 0) {
      where.siteId = { in: params.filters.siteIds };
    }
    if (params.filters?.roleIds && params.filters.roleIds.length > 0) {
      where.roles = { some: { roleId: { in: params.filters.roleIds } } };
    }
    const records = await this.prisma.user.findMany({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    const total = await this.prisma.user.count({ where });
    return {
      items: records.map((r) => this.mapRecord(r)),
      page: params.page,
      limit: params.limit,
      total,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug('User findByEmail', getContext());
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
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
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByDepartmentId(departmentId: string): Promise<User[]> {
    this.logger.debug('User findByDepartmentId', getContext());
    const records = await this.prisma.user.findMany({
      where: { departmentId },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  async findByRoleId(roleId: string): Promise<User[]> {
    this.logger.debug('User findByRoleId', getContext());
    const records = await this.prisma.user.findMany({
      where: { roles: { some: { roleId } } },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  async findBySiteId(siteId: string): Promise<User[]> {
    this.logger.debug('User findBySiteId', getContext());
    const records = await this.prisma.user.findMany({
      where: { siteId },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return records.map(r => this.mapRecord(r));
  }

  async findUsersWithPasswordChangedBefore(date: Date): Promise<User[]> {
    this.logger.debug('User findUsersWithPasswordChangedBefore', getContext());
    const records = await this.prisma.user.findMany({
      where: {
        passwordChangedAt: {
          lte: date,
        },
      },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
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
        lastLogin: user.lastLogin ?? undefined,
        lastActivity: user.lastActivity ?? undefined,
        failedLoginAttempts: user.failedLoginAttempts,
        lastFailedLoginAt: user.lastFailedLoginAt ?? undefined,
        lockedUntil: user.lockedUntil ?? undefined,
        passwordChangedAt: user.passwordChangedAt,
        createdById: user.createdBy?.id,
        updatedById: user.updatedBy?.id,
        mfaEnabled: user.mfaEnabled,
        mfaType: user.mfaType ?? undefined,
        mfaSecret: user.mfaSecret ?? undefined,
        mfaRecoveryCodes: user.mfaRecoveryCodes,
        permissions: {
          create: user.permissions.map((p) => ({
            scopeId: p.scopeId ?? undefined,
            denyPermission: p.denyPermission,
            permission: { connect: { id: p.permission.id } },
          })),
        },
        roles: {
          create: user.roles.map(r => ({ role: { connect: { id: r.id } } })),
        },
      },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
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
        lastLogin: user.lastLogin ?? undefined,
        lastActivity: user.lastActivity ?? undefined,
        failedLoginAttempts: user.failedLoginAttempts,
        lastFailedLoginAt: user.lastFailedLoginAt ?? undefined,
        lockedUntil: user.lockedUntil ?? undefined,
        passwordChangedAt: user.passwordChangedAt,
        updatedById: user.updatedBy?.id,
        mfaEnabled: user.mfaEnabled,
        mfaType: user.mfaType ?? undefined,
        mfaSecret: user.mfaSecret ?? undefined,
        mfaRecoveryCodes: user.mfaRecoveryCodes,
        permissions: {
          deleteMany: {},
          create: user.permissions.map((p) => ({
            scopeId: p.scopeId ?? undefined,
            denyPermission: p.denyPermission,
            permission: { connect: { id: p.permission.id } },
          })),
        },
        roles: {
          deleteMany: {},
          create: user.roles.map(r => ({ role: { connect: { id: r.id } } })),
        },
      },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        department: { include: { site: true } },
        site: true,
        permissions: { include: { permission: true } },
        createdBy: true,
        updatedBy: true,
      },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting user', getContext());
    await this.prisma.user.delete({ where: { id } });
  }
}
