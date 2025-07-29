import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaUserRepository } from '../../../adapters/repositories/PrismaUserRepository';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prismaClient: DeepMockProxy<PrismaClient>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let mockUser: User;
  let mockRole: Role;
  let department: Department;
  let site: Site;
  const includeRelations = {
    roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    department: { include: { site: true } },
    site: true,
    permissions: { include: { permission: true } },
    createdBy: true,
    updatedBy: true,
  };

  beforeEach(() => {
    // Create deep mock of Prisma client
    prismaClient = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repository = new PrismaUserRepository(prismaClient, logger);

    // Setup test data
    mockRole = new Role('role-123', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    mockUser = new User(
      'user-123',
      'John',
      'Doe',
      'john.doe@example.com',
      [mockRole],
      'active',
      department,
      site
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
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin',
              permissions: []
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
        include: includeRelations,
      });
    });

    it('should return null when user not found', async () => {
      prismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: includeRelations,
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
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.findUnique.mockResolvedValue(mockPrismaUserNoRoles as any);

      const result = await repository.findById('user-456');

      expect(result).not.toBeNull();
      expect(result?.roles).toHaveLength(0);
    });

    it('should map role permissions correctly', async () => {
      const mockPrismaUserWithPerm = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin',
              permissions: [
                { permission: { id: 'perm-1', permissionKey: 'ROOT', description: 'root' } },
              ]
            }
          }
        ]
      };

      prismaClient.user.findUnique.mockResolvedValue(mockPrismaUserWithPerm as any);

      const result = await repository.findById('user-123');

      expect(result?.roles[0].permissions[0].id).toBe('perm-1');
      expect(result?.roles[0].permissions[0].permissionKey).toBe('ROOT');
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
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin',
              permissions: []
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
        include: includeRelations,
      });
    });

    it('should return null when user not found by email', async () => {
      prismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByExternalAuth', () => {
    it('should return user when found via external provider', async () => {
      const mockPrismaUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        externalProvider: 'google',
        externalId: 'g123',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.findFirst.mockResolvedValue(mockPrismaUser as any);

      const result = await repository.findByExternalAuth('google', 'g123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
      expect(prismaClient.user.findFirst).toHaveBeenCalledWith({
        where: { externalProvider: 'google', externalId: 'g123' },
        include: includeRelations,
      });
    });

    it('should return null when user not found via external provider', async () => {
      prismaClient.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByExternalAuth('google', 'unknown');

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
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin',
              permissions: []
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
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          createdById: undefined,
          updatedById: undefined,
          permissions: { create: [] },
          status: 'active',
          roles: {
            create: [{ role: { connect: { id: 'role-123' } } }],
          },
        },
        include: includeRelations,
      });
    });

    it('should create user with permissions', async () => {
      const perm = new Permission('perm-1', 'READ', 'read');
      mockUser.permissions = [perm];

      const mockPrismaCreatedUserPerm = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [{ userId: 'user-123', permissionId: 'perm-1', permission: { id: 'perm-1', permissionKey: 'READ', description: 'read' } }],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.create.mockResolvedValue(mockPrismaCreatedUserPerm as any);

      const result = await repository.create(mockUser);

      expect(result.permissions).toHaveLength(1);
      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          password: '',
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          createdById: undefined,
          updatedById: undefined,
          permissions: { create: [{ permission: { connect: { id: 'perm-1' } } }] },
          status: 'active',
          roles: {
            create: [{ role: { connect: { id: 'role-123' } } }],
          },
        },
        include: includeRelations,
      });
    });

    it('should create user without roles', async () => {
      const userWithoutRoles = new User(
        'user-456',
        'Jane',
        'Smith',
        'jane.smith@example.com',
        [],
        'active',
        department,
        site
      );

      const mockPrismaCreatedUser = {
        id: 'user-456',
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
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
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          createdById: undefined,
          updatedById: undefined,
          permissions: { create: [] },
          status: 'active',
          roles: {
            create: [],
          },
        },
        include: includeRelations,
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
        'suspended',
        department,
        site
      );

      const mockPrismaUpdatedUser = {
        id: 'user-123',
        firstname: 'Johnny',
        lastname: 'Smith',
        email: 'johnny.smith@example.com',
        password: 'hashed-password',
        status: 'suspended',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-123',
            role: {
              id: 'role-123',
              label: 'Admin',
              permissions: []
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
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          updatedById: undefined,
          permissions: { deleteMany: {}, create: [] },
          roles: {
            deleteMany: {},
            create: [{ role: { connect: { id: 'role-123' } } }],
          },
        },
        include: includeRelations,
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
        'active',
        department,
        site
      );

      const mockPrismaUpdatedUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          {
            userId: 'user-123',
            roleId: 'role-456',
            role: {
              id: 'role-456',
              label: 'User',
              permissions: []
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
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          updatedById: undefined,
          permissions: { deleteMany: {}, create: [] },
          roles: {
            deleteMany: {},
            create: [{ role: { connect: { id: 'role-456' } } }],
          },
        },
        include: includeRelations,
      });
    });

    it('should update user permissions', async () => {
      const perm = new Permission('perm-2', 'WRITE', 'write');
      const updatedUser = new User(
        'user-123',
        'John',
        'Doe',
        'john.doe@example.com',
        [mockRole],
        'active',
        department,
        site,
        undefined,
        [perm]
      );

      const mockPrismaUpdatedPermUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [{ userId: 'user-123', permissionId: 'perm-2', permission: { id: 'perm-2', permissionKey: 'WRITE', description: 'write' } }],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      };

      prismaClient.user.update.mockResolvedValue(mockPrismaUpdatedPermUser as any);

      const result = await repository.update(updatedUser);

      expect(result.permissions).toHaveLength(1);
      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          status: 'active',
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          updatedById: undefined,
          permissions: { deleteMany: {}, create: [{ permission: { connect: { id: 'perm-2' } } }] },
          roles: {
            deleteMany: {},
            create: [{ role: { connect: { id: 'role-123' } } }],
          },
        },
        include: includeRelations,
      });
    });

    it('should update user and remove all roles', async () => {
      const updatedUser = new User(
        'user-123',
        'John',
        'Doe',
        'john.doe@example.com',
        [],
        'active',
        department,
        site
      );

      const mockPrismaUpdatedUser = {
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashed-password',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: "dept-1", label: "IT", parentDepartmentId: null, managerUserId: null, siteId: "site-1", site: { id: "site-1", label: "HQ" } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
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
          departmentId: 'dept-1',
          siteId: 'site-1',
          picture: undefined,
          lastLogin: undefined,
          lastActivity: undefined,
          failedLoginAttempts: 0,
          lastFailedLoginAt: undefined,
          lockedUntil: undefined,
          passwordChangedAt: expect.any(Date),
          updatedById: undefined,
          permissions: { deleteMany: {}, create: [] },
          roles: {
            deleteMany: {},
            create: [],
          },
        },
        include: includeRelations,
      });
    });
  });

  describe('findByDepartmentId', () => {
    it('should retrieve users by department', async () => {
      prismaClient.user.findMany.mockResolvedValue([{
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: '',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: 'dept-1', label: 'IT', parentDepartmentId: null, managerUserId: null, siteId: 'site-1', site: { id: 'site-1', label: 'HQ' } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      }] as any);

      const result = await repository.findByDepartmentId('dept-1');

      expect(result).toHaveLength(1);
      expect(prismaClient.user.findMany).toHaveBeenCalledWith({
        where: { departmentId: 'dept-1' },
        include: includeRelations,
      });
    });
  });

  describe('findByRoleId', () => {
    it('should retrieve users by role', async () => {
      prismaClient.user.findMany.mockResolvedValue([{ 
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: '',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: 'dept-1', label: 'IT', parentDepartmentId: null, managerUserId: null, siteId: 'site-1', site: { id: 'site-1', label: 'HQ' } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      }] as any);

      const result = await repository.findByRoleId('role-1');

      expect(result).toHaveLength(1);
      expect(prismaClient.user.findMany).toHaveBeenCalledWith({
        where: { roles: { some: { roleId: 'role-1' } } },
        include: includeRelations,
      });
    });
  });

  describe('findBySiteId', () => {
    it('should retrieve users by site', async () => {
      prismaClient.user.findMany.mockResolvedValue([{ 
        id: 'user-123',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: '',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: { id: 'dept-1', label: 'IT', parentDepartmentId: null, managerUserId: null, siteId: 'site-1', site: { id: 'site-1', label: 'HQ' } },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: []
      }] as any);

      const result = await repository.findBySiteId('site-1');

      expect(result).toHaveLength(1);
      expect(prismaClient.user.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-1' },
        include: includeRelations,
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

  it('should paginate users', async () => {
    prismaClient.user.findMany.mockResolvedValue([] as any);
    prismaClient.user.count.mockResolvedValue(0 as any);
    const result = await repository.findPage({ page: 1, limit: 10 });
    expect(result).toEqual({ items: [], page: 1, limit: 10, total: 0 });
    expect(prismaClient.user.findMany).toHaveBeenCalled();
    expect(prismaClient.user.count).toHaveBeenCalled();
  });

  it('should return all users', async () => {
    prismaClient.user.findMany.mockResolvedValue([
      {
        id: 'u',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        status: 'active',
        departmentId: 'dept-1',
        siteId: 'site-1',
        department: {
          id: 'dept-1',
          label: 'IT',
          parentDepartmentId: null,
          managerUserId: null,
          siteId: 'site-1',
          site: { id: 'site-1', label: 'HQ' },
        },
        site: { id: 'site-1', label: 'HQ' },
        picture: null,
        permissions: [],
        roles: [],
      },
    ] as any);

    const result = await repository.findAll();

    expect(result).toHaveLength(1);
    expect(prismaClient.user.findMany).toHaveBeenCalledWith({
      include: includeRelations,
    });
  });
});
