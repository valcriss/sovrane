import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RefreshAccessTokenUseCase } from '../../../usecases/user/RefreshAccessTokenUseCase';
import { RefreshTokenRepositoryPort } from '../../../domain/ports/RefreshTokenRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RefreshAccessTokenUseCase', () => {
  let refreshRepo: DeepMockProxy<RefreshTokenRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let tokenService: DeepMockProxy<TokenServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let useCase: RefreshAccessTokenUseCase;
  let user: User;

  beforeEach(() => {
    refreshRepo = mockDeep<RefreshTokenRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    tokenService = mockDeep<TokenServicePort>();
    logger = mockDeep<LoggerPort>();
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    useCase = new RefreshAccessTokenUseCase(refreshRepo, userRepo, tokenService, logger);
  });

  it('should refresh tokens', async () => {
    const token = new RefreshToken('old', 'u', new Date(Date.now() + 1000));
    refreshRepo.findByToken.mockResolvedValue(token);
    userRepo.findById.mockResolvedValue(user);
    tokenService.generateAccessToken.mockReturnValue('newT');
    tokenService.generateRefreshToken.mockResolvedValue('newR');

    const result = await useCase.execute('old');

    expect(result).toEqual({ token: 'newT', refreshToken: 'newR' });
    expect(refreshRepo.delete).toHaveBeenCalledWith('old');
  });

  it('should throw when token missing', async () => {
    refreshRepo.findByToken.mockResolvedValue(null);
    await expect(useCase.execute('bad')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw when token expired', async () => {
    const token = new RefreshToken('old', 'u', new Date(Date.now() - 1000));
    refreshRepo.findByToken.mockResolvedValue(token);
    await expect(useCase.execute('old')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw when user suspended', async () => {
    const token = new RefreshToken('old', 'u', new Date(Date.now() + 1000));
    refreshRepo.findByToken.mockResolvedValue(token);
    const suspended = new User('u', 'John', 'Doe', 'john@example.com', [new Role('r', 'Role')], 'suspended', new Department('d', 'Dept', null, null, new Site('s', 'Site')), new Site('s', 'Site'));
    userRepo.findById.mockResolvedValue(suspended);
    await expect(useCase.execute('old')).rejects.toThrow('User account is suspended or archived');
  });

  it('should throw when user not found', async () => {
    const token = new RefreshToken('t', 'u', new Date(Date.now() + 1000));
    refreshRepo.findByToken.mockResolvedValue(token);
    userRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('t')).rejects.toThrow('Invalid or expired refresh token');
  });
});

