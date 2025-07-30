import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RotateRefreshTokenUseCase } from '../../../usecases/user/RotateRefreshTokenUseCase';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { AuditEventType } from '../../../domain/entities/AuditEventType';
import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { RefreshTokenTooSoonException } from '../../../domain/errors/RefreshTokenTooSoonException';
import { InvalidRefreshTokenException } from '../../../domain/errors/InvalidRefreshTokenException';

describe('RotateRefreshTokenUseCase', () => {
  let refreshRepo: DeepMockProxy<RefreshTokenPort>;
  let tokenService: DeepMockProxy<TokenServicePort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let audit: DeepMockProxy<AuditPort>;
  let useCase: RotateRefreshTokenUseCase;
  let user: User;

  beforeEach(() => {
    refreshRepo = mockDeep<RefreshTokenPort>();
    tokenService = mockDeep<TokenServicePort>();
    userRepo = mockDeep<UserRepositoryPort>();
    audit = mockDeep<AuditPort>();
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', dept, site);
    useCase = new RotateRefreshTokenUseCase(refreshRepo, tokenService, userRepo, audit);
  });

  it('should log refresh event', async () => {
    const token = new RefreshToken('1', 'u', 'h', new Date(Date.now() + 1000));
    refreshRepo.findValidByToken.mockResolvedValue(token);
    userRepo.findById.mockResolvedValue(user);
    tokenService.generateRefreshToken.mockResolvedValue('newR');
    tokenService.generateAccessToken.mockReturnValue('newT');

    await useCase.execute('old', '1.1.1.1', 'agent');

    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(
      user,
      '1.1.1.1',
      'agent',
    );

    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.actorId).toBe('u');
    expect(event.action).toBe(AuditEventType.AUTH_REFRESH);
    expect(event.ipAddress).toBe('1.1.1.1');
    expect(event.userAgent).toBe('agent');
  });

  it('should reject refreshes performed too soon', async () => {
    const token = new RefreshToken(
      '1',
      'u',
      'h',
      new Date(Date.now() + 600_000),
      new Date(),
    );
    refreshRepo.findValidByToken.mockResolvedValue(token);
    userRepo.findById.mockResolvedValue(user);

    await expect(useCase.execute('old')).rejects.toBeInstanceOf(
      RefreshTokenTooSoonException,
    );
  });

  it('should reject when user not found', async () => {
    const token = new RefreshToken('1', 'u', 'h', new Date(Date.now() + 1000));
    refreshRepo.findValidByToken.mockResolvedValue(token);
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('old')).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });
});
