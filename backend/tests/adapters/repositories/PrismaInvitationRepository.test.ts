import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaInvitationRepository } from '../../../adapters/repositories/PrismaInvitationRepository';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { Invitation } from '../../../domain/entities/Invitation';

describe('PrismaInvitationRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: DeepMockProxy<LoggerPort>;
  let repo: PrismaInvitationRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repo = new PrismaInvitationRepository(prisma, logger);
  });

  it('should create invitation', async () => {
    prisma.invitation.create.mockResolvedValue({
      email: 'a',
      token: 't',
      status: 'pending',
      expiresAt: new Date('2024-01-01'),
      firstName: null,
      lastName: null,
      role: null,
      id: '1',
      createdAt: new Date('2024-01-01'),
    } as any);

    const inv = await repo.create(new Invitation('a', 't', 'pending', new Date('2024-01-01')));

    expect(inv.email).toBe('a');
    expect(prisma.invitation.create).toHaveBeenCalled();
  });

  it('should find by token', async () => {
    prisma.invitation.findUnique.mockResolvedValue({
      email: 'a',
      token: 't',
      status: 'pending',
      expiresAt: new Date('2024-01-01'),
      firstName: null,
      lastName: null,
      role: null,
      id: '1',
      createdAt: new Date('2024-01-01'),
    } as any);

    const inv = await repo.findByToken('t');

    expect(inv?.token).toBe('t');
    expect(prisma.invitation.findUnique).toHaveBeenCalledWith({ where: { token: 't' } });
  });

  it('should return null when token not found', async () => {
    prisma.invitation.findUnique.mockResolvedValue(null);
    const inv = await repo.findByToken('x');
    expect(inv).toBeNull();
  });

  it('should find by email', async () => {
    prisma.invitation.findFirst.mockResolvedValue({
      email: 'b',
      token: 'u',
      status: 'pending',
      expiresAt: new Date('2024-01-01'),
      firstName: null,
      lastName: null,
      role: null,
      id: '2',
      createdAt: new Date('2024-01-01'),
    } as any);

    const inv = await repo.findByEmail('b');

    expect(inv?.email).toBe('b');
    expect(prisma.invitation.findFirst).toHaveBeenCalledWith({ where: { email: 'b' } });
  });

  it('should return null when email not found', async () => {
    prisma.invitation.findFirst.mockResolvedValue(null);
    const inv = await repo.findByEmail('z');
    expect(inv).toBeNull();
  });
});
