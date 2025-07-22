import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaUserRepository } from '../../../adapters/repositories/PrismaUserRepository';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prismaClient: DeepMockProxy<PrismaClient>;
  let mockUser: User;
  let mockRole: Role;

  beforeEach(() => {
    // Create deep mock of Prisma client
    prismaClient = mockDeep<PrismaClient>();
    repository = new PrismaUserRepository(prismaClient);

    // Setup test data
    mockRole = new Role('role-123', 'Admin');
    mockUser = new User(
      'user-123',
      'John',
      'Doe',
      'john.doe@example.com',
      [mockRole],
      'active'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockPrismaUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin'
            }
          }
        ]
      };

      prismaClient.user.findUnique.mockResolvedValue(mockPrismaUser as any);

      const result = await repository.findById('user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
      expect(result?.firstName).toBe('John');
      expect(result?.lastName).toBe('Doe');
      expect(result?.email).toBe('john.doe@example.com');
      expect(result?.status).toBe('active');
      expect(result?.roles).toHaveLength(1);
      expect(result?.roles[0].id).toBe('role-123');
      expect(result?.roles[0].label).toBe('Admin');

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { roles: { include: { role: true } } },
      });
    });

    it('should return null when user not found', async () => {
      prismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: { roles: { include: { role: true } } },
      });
    });

    it('should handle user without roles', async () => {
      const mockPrismaUserNoRoles = {
        id: 'user-456',
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.findUnique.mockResolvedValue(mockPrismaUserNoRoles as any);

      const result = await repository.findById('user-456');

      expect(result).not.toBeNull();
      expect(result?.roles).toHaveLength(0);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockPrismaUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin'
            }
          }
        ]
      };

      prismaClient.user.findUnique.mockResolvedValue(mockPrismaUser as any);

      const result = await repository.findByEmail('john.doe@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('john.doe@example.com');

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
        include: { roles: { include: { role: true } } },
      });
    });

    it('should return null when user not found by email', async () => {
      prismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const mockPrismaCreatedUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin'
            }
          }
        ]
      };

      prismaClient.user.create.mockResolvedValue(mockPrismaCreatedUser as any);

      const result = await repository.create(mockUser);

      expect(result).not.toBeNull();
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('john.doe@example.com');

      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          password: '',
          status: 'active',
          roles: {
            create: [{ role: { connect: { id: 'role-123' } } }],
          },
        },
        include: { roles: { include: { role: true } } },
      });
    });

    it('should create user without roles', async () => {
      const userWithoutRoles = new User(
        'user-456',
        'Jane',
        'Smith',
        'jane.smith@example.com',
        [],
        'active'
      );

      const mockPrismaCreatedUser = {
        id: 'user-456',
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.create.mockResolvedValue(mockPrismaCreatedUser as any);

      const result = await repository.create(userWithoutRoles);

      expect(result.roles).toHaveLength(0);
      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-456',
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane.smith@example.com',
          password: '',
          status: 'active',
          roles: {
            create: [],
          },
        },
        include: { roles: { include: { role: true } } },
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updatedUser = new User(
        'user-123',
        'Johnny',
        'Smith',
        'johnny.smith@example.com',
        [mockRole],
        'suspended'
      );

      const mockPrismaUpdatedUser = {
        id: 'user-123',
        firstname: 'Johnny',
        lastname: 'Smith',
        email: 'johnny.smith@example.com',
        password: 'hashed-password',
        status: 'suspended',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin'
            }
          }
        ]
      };

      prismaClient.user.update.mockResolvedValue(mockPrismaUpdatedUser as any);

      const result = await repository.update(updatedUser);

      expect(result).not.toBeNull();
      expect(result.id).toBe('user-123');
      expect(result.firstName).toBe('Johnny');
      expect(result.lastName).toBe('Smith');
      expect(result.email).toBe('johnny.smith@example.com');
      expect(result.status).toBe('suspended');

      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          firstname: 'Johnny',
          lastname: 'Smith',
          email: 'johnny.smith@example.com',
          status: 'suspended',
          roles: {
            deleteMany: {},
            create: [{ role: { connect: { id: 'role-123' } } }],
          },
        },
        include: { roles: { include: { role: true } } },
      });
    });

    it('should update user with different roles', async () => {
      const newRole = new Role('role-456', 'User');
      const updatedUser = new User(
        'user-123',
        'John',
        'Doe',
        'john.doe@example.com',
        [newRole],
        'active'
      );

      const mockPrismaUpdatedUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-456',
            role: {
              id: 'role-456',
              label: 'User'
            }
          }
        ]
      };

      prismaClient.user.update.mockResolvedValue(mockPrismaUpdatedUser as any);

      const result = await repository.update(updatedUser);

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].id).toBe('role-456');
      expect(result.roles[0].label).toBe('User');

      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          status: 'active',
          roles: {
            deleteMany: {},
            create: [{ role: { connect: { id: 'role-456' } } }],
          },
        },
        include: { roles: { include: { role: true } } },
      });
    });

    it('should update user and remove all roles', async () => {
      const updatedUser = new User(
        'user-123',
        'John',
        'Doe',
        'john.doe@example.com',
        [],
        'active'
      );

      const mockPrismaUpdatedUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.update.mockResolvedValue(mockPrismaUpdatedUser as any);

      const result = await repository.update(updatedUser);

      expect(result.roles).toHaveLength(0);

      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          status: 'active',
          roles: {
            deleteMany: {},
            create: [],
          },
        },
        include: { roles: { include: { role: true } } },
      });
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      prismaClient.user.delete.mockResolvedValue(undefined as any);

      await repository.delete('user-123');

      expect(prismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
    });

    it('should handle deletion of non-existent user', async () => {
      prismaClient.user.delete.mockRejectedValue(new Error('User not found'));

      await expect(repository.delete('non-existent-id')).rejects.toThrow('User not found');

      expect(prismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' }
      });
    });
  });
});
