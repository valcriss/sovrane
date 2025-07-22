import { PrismaClient } from '@prisma/client';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

export class PrismaUserRepository implements UserRepositoryPort {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<User | null> {
        const record = await this.prisma.user.findUnique({ where: { id } });
        return record ? new User(
            record.id,
            record.firstname,
            record.lastname,
            record.email,
            record.roles,
            record.status as "active" | "suspended" | "archived" | undefined
        ) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const record = await this.prisma.user.findUnique({ where: { email } });
        return record ? new User(record.id, record.firstName, record.lastName, record.email, record.roles, record.status) : null;
    }

    async create(user: User): Promise<User> {
        const record = await this.prisma.user.create({
            data: {
                id: user.id,
                firstname: user.firstName,
                lastname: user.lastName,
                email: user.email,
                // roles: user.roles.join(','), // Removed because 'roles' is not a valid field in Prisma schema
                status: user.status,
            },
        });
        return new User(record.id, record.firstname, record.lastname, record.email, record.roles, record.status);
    }

    async update(user: User): Promise<User> {
        const record = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                login: user.firstName, // Assuming firstName is used as login
                email: user.email,
                roles: user.roles.join(','), // Assuming roles are stored as a comma-separated string
                status: user.status,
            },
        });
        return new User(record.id, record.firstName, record.lastName, record.email, record.roles, record.status);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }
}
