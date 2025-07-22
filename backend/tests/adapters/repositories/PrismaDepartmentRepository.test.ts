import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaDepartmentRepository } from '../../../adapters/repositories/PrismaDepartmentRepository';
import { Department } from '../../../domain/entities/Department';

describe('PrismaDepartmentRepository', () => {
  let repo: PrismaDepartmentRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let dept: Department;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new PrismaDepartmentRepository(prisma);
    dept = new Department('dept-1', 'IT', null, 'user-1');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find by id', async () => {
    prisma.department.findUnique.mockResolvedValue({
      id: 'dept-1',
      label: 'IT',
      parentDepartmentId: null,
      managerUserId: 'user-1'
    } as any);

    const result = await repo.findById('dept-1');
    expect(result).toEqual(dept);
    expect(prisma.department.findUnique).toHaveBeenCalledWith({ where: { id: 'dept-1' } });
  });

  it('should return null when department not found', async () => {
    prisma.department.findUnique.mockResolvedValue(null);

    const result = await repo.findById('unknown');

    expect(result).toBeNull();
    expect(prisma.department.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' } });
  });

  it('should create a department', async () => {
    prisma.department.create.mockResolvedValue({
      id: 'dept-1',
      label: 'IT',
      parentDepartmentId: null,
      managerUserId: 'user-1'
    } as any);

    const result = await repo.create(dept);
    expect(result).toEqual(dept);
    expect(prisma.department.create).toHaveBeenCalledWith({
      data: {
        id: 'dept-1',
        label: 'IT',
        parentDepartmentId: null,
        managerUserId: 'user-1'
      }
    });
  });

  it('should find by label', async () => {
    prisma.department.findFirst.mockResolvedValue({
      id: 'dept-1',
      label: 'IT',
      parentDepartmentId: null,
      managerUserId: 'user-1'
    } as any);

    const result = await repo.findByLabel('IT');
    expect(result).toEqual(dept);
    expect(prisma.department.findFirst).toHaveBeenCalledWith({ where: { label: 'IT' } });
  });

  it('should return null when department not found by label', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    const result = await repo.findByLabel('Unknown');

    expect(result).toBeNull();
    expect(prisma.department.findFirst).toHaveBeenCalledWith({ where: { label: 'Unknown' } });
  });

  it('should update a department', async () => {
    const updated = new Department('dept-1', 'Tech', null, 'user-2');
    prisma.department.update.mockResolvedValue({
      id: 'dept-1',
      label: 'Tech',
      parentDepartmentId: null,
      managerUserId: 'user-2'
    } as any);

    const result = await repo.update(updated);
    expect(result).toEqual(updated);
    expect(prisma.department.update).toHaveBeenCalledWith({
      where: { id: 'dept-1' },
      data: {
        label: 'Tech',
        parentDepartmentId: null,
        managerUserId: 'user-2'
      }
    });
  });

  it('should delete a department', async () => {
    prisma.department.delete.mockResolvedValue(undefined as any);

    await repo.delete('dept-1');

    expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 'dept-1' } });
  });
});
