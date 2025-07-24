/* istanbul ignore file */
import {
  PrismaClient,
  Prisma,
  User as PrismaUser,
  Department as PrismaDepartment,
  Site as PrismaSite,
  Role as PrismaRole,
  Permission as PrismaPermission,
} from '@prisma/client';
import { UserGroupRepositoryPort, UserGroupFilters } from '../../domain/ports/UserGroupRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { UserGroup } from '../../domain/entities/UserGroup';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';
import { Permission } from '../../domain/entities/Permission';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

export class PrismaUserGroupRepository implements UserGroupRepositoryPort {
  constructor(private prisma: PrismaClient, private readonly logger: LoggerPort) {}

  private mapUser(record: PrismaUser & {
    roles: Array<{ role: PrismaRole }>;
    department: PrismaDepartment & { site: PrismaSite };
    site: PrismaSite;
    permissions: Array<{ permission: PrismaPermission }>;
  }): User {
    return new User(
      record.id,
      record.firstname,
      record.lastname,
      record.email,
      record.roles.map(r => new Role(r.role.id, r.role.label)),
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
      record.permissions.map(p => new Permission(p.permission.id, p.permission.permissionKey, p.permission.description)),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRecord(record: any & {
    responsibleUser: PrismaUser & {
      roles: Array<{ role: PrismaRole }>;
      department: PrismaDepartment & { site: PrismaSite };
      site: PrismaSite;
      permissions: Array<{ permission: PrismaPermission }>;
    };
    members: Array<{ user: PrismaUser & {
      roles: Array<{ role: PrismaRole }>;
      department: PrismaDepartment & { site: PrismaSite };
      site: PrismaSite;
      permissions: Array<{ permission: PrismaPermission }>;
    } }>;
  }): UserGroup {
    return new UserGroup(
      record.id,
      record.name,
      this.mapUser(record.responsibleUser),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      record.members.map((m: any) => this.mapUser(m.user)),
      record.description ?? undefined,
    );
  }

  async findById(id: string): Promise<UserGroup | null> {
    this.logger.debug('UserGroup findById', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).userGroup.findUnique({
      where: { id },
      include: {
        responsibleUser: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } },
        members: { include: { user: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } } } },
      },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findAll(): Promise<UserGroup[]> {
    this.logger.debug('UserGroup findAll', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (this.prisma as any).userGroup.findMany({
      include: {
        responsibleUser: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } },
        members: { include: { user: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } } } },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return records.map((r: any) => this.mapRecord(r));
  }

  /* istanbul ignore next */
  async findPage(
    params: ListParams & { filters?: UserGroupFilters },
  ): Promise<PaginatedResult<UserGroup>> {
    this.logger.debug('UserGroup findPage', getContext());
    const where: Prisma.UserGroupWhereInput = {};
    if (params.filters?.search) {
      where.name = { contains: params.filters.search, mode: 'insensitive' };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (this.prisma as any).userGroup.findMany({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
      include: {
        responsibleUser: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } },
        members: { include: { user: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } } } },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = await (this.prisma as any).userGroup.count({ where });
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: records.map((r: any) => this.mapRecord(r)),
      page: params.page,
      limit: params.limit,
      total,
    };
  }

  async create(group: UserGroup): Promise<UserGroup> {
    this.logger.info('Creating user group', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).userGroup.create({
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        responsibleUserId: group.responsibleUser.id,
        members: {
          create: group.members.map(u => ({ user: { connect: { id: u.id } } })),
        },
      },
      include: {
        responsibleUser: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } },
        members: { include: { user: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } } } },
      },
    });
    return this.mapRecord(record);
  }

  async update(group: UserGroup): Promise<UserGroup> {
    this.logger.info('Updating user group', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (this.prisma as any).userGroup.update({
      where: { id: group.id },
      data: {
        name: group.name,
        description: group.description,
        responsibleUserId: group.responsibleUser.id,
      },
      include: {
        responsibleUser: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } },
        members: { include: { user: { include: { roles: { include: { role: true } }, department: { include: { site: true } }, site: true, permissions: { include: { permission: true } } } } } },
      },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting user group', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).userGroup.delete({ where: { id } });
  }

  async addUser(groupId: string, userId: string): Promise<UserGroup | null> {
    this.logger.info('Adding user to group', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).userGroupMember.create({ data: { groupId, userId } });
    return this.findById(groupId);
  }

  async removeUser(groupId: string, userId: string): Promise<UserGroup | null> {
    this.logger.info('Removing user from group', getContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma as any).userGroupMember.delete({ where: { userId_groupId: { userId, groupId } } });
    return this.findById(groupId);
  }
}
