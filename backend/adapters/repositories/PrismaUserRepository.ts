import { PrismaClient, User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  private mapRecord(record: PrismaUser & { roles: Array<{ role: PrismaRole }> }): User {
    return new User(
      record.id,
      record.firstname,
      record.lastname,
      record.email,
      record.roles.map((ur) => new Role(ur.role.id, ur.role.label)),
      record.status as 'active' | 'suspended' | 'archived',
      record.departmentId
    );
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByExternalAuth(provider: string, externalId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({
      where: { 
        externalProvider: provider,
        externalId: externalId
      },
      include: { roles: { include: { role: true } } },
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
        departmentId: user.departmentId,
        roles: {
          create: user.roles.map(r => ({ role: { connect: { id: r.id } } })),
        },
      },
      include: { roles: { include: { role: true } } },
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
        departmentId: user.departmentId,
        roles: {
          deleteMany: {},
          create: user.roles.map(r => ({ role: { connect: { id: r.id } } })),
        },
      },
      include: { roles: { include: { role: true } } },
    });
    return this.mapRecord(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
