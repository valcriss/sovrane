import { PrismaRefreshTokenRepository } from '../../../adapters/repositories/PrismaRefreshTokenRepository';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import argon2 from 'argon2';

describe('PrismaRefreshTokenRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let repo: PrismaRefreshTokenRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repo = new PrismaRefreshTokenRepository(prisma, logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when token is expired', async () => {
    prisma.refreshToken.findMany.mockResolvedValue([] as any);
    const result = await repo.findValidByToken('t');
    expect(result).toBeNull();
    expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
      where: { revokedAt: null, expiresAt: { gt: expect.any(Date) } },
    });
  });

  it('should return null when token is revoked', async () => {
    prisma.refreshToken.findMany.mockResolvedValue([] as any);
    const result = await repo.findValidByToken('t');
    expect(result).toBeNull();
    expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
      where: { revokedAt: null, expiresAt: { gt: expect.any(Date) } },
    });
  });

  it('should return null when token is marked used', async () => {
    const record = {
      id: '1',
      userId: 'u',
      tokenHash: await argon2.hash('t'),
      expiresAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
      revokedAt: null,
      replacedBy: null,
      usedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    } as any;
    prisma.refreshToken.findMany.mockResolvedValue([record]);

    const result = await repo.findValidByToken('t');

    expect(result).toBeNull();
    expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
      where: { revokedAt: null, expiresAt: { gt: expect.any(Date) } },
    });
  });

  it('should return null when token does not match', async () => {
    const record = {
      id: 'm',
      userId: 'u',
      tokenHash: await argon2.hash('other'),
      expiresAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
      revokedAt: null,
      replacedBy: null,
      usedAt: null,
      ipAddress: null,
      userAgent: null,
    } as any;
    prisma.refreshToken.findMany.mockResolvedValue([record]);
    const result = await repo.findValidByToken('wrong');
    expect(result).toBeNull();
  });

  it('should return token when valid', async () => {
    const record = {
      id: '1',
      userId: 'u',
      tokenHash: await argon2.hash('t'),
      expiresAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
      revokedAt: null,
      replacedBy: null,
      usedAt: null,
      ipAddress: undefined,
      userAgent: undefined,
    } as any;
    prisma.refreshToken.findMany.mockResolvedValue([record]);

    const result = await repo.findValidByToken('t');

    expect(result?.id).toBe('1');
    expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
      where: { revokedAt: null, expiresAt: { gt: expect.any(Date) } },
    });
  });

  it('should save a token', async () => {
    const token = {
      id: 't1',
      userId: 'u1',
      tokenHash: 'h',
      expiresAt: new Date(),
      createdAt: new Date(),
      ipAddress: 'ip',
      userAgent: 'ua',
    } as any;

    await repo.save(token);

    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        id: 't1',
        userId: 'u1',
        tokenHash: 'h',
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        ipAddress: 'ip',
        userAgent: 'ua',
      },
    });
  });

  it('should mark a token as used', async () => {
    prisma.refreshToken.update.mockResolvedValue({} as any);
    await repo.markAsUsed('t1', 'new');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: {
        usedAt: expect.any(Date),
        replacedBy: expect.any(String),
      },
    });
  });

  it('should mark a token as used without replacement', async () => {
    prisma.refreshToken.update.mockResolvedValue({} as any);
    await repo.markAsUsed('t2');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 't2' },
      data: {
        usedAt: expect.any(Date),
        replacedBy: undefined,
      },
    });
  });

  it('should revoke a token', async () => {
    prisma.refreshToken.update.mockResolvedValue({} as any);
    await repo.revoke('t1');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('should revoke all tokens for a user', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({} as any);
    await repo.revokeAll('u1');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
