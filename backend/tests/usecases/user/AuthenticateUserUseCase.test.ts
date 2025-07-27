import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AuthenticateUserUseCase } from '../../../usecases/user/AuthenticateUserUseCase';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { User } from '../../../domain/entities/User';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../domain/ports/AuditPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { AuditEvent } from '../../../domain/entities/AuditEvent';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('AuthenticateUserUseCase', () => {
  let service: DeepMockProxy<AuthServicePort>;
  let tokenService: DeepMockProxy<TokenServicePort>;
  let repo: DeepMockProxy<UserRepositoryPort>;
  let audit: DeepMockProxy<AuditPort>;
  let logger: DeepMockProxy<LoggerPort>;
  let useCase: AuthenticateUserUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    service = mockDeep<AuthServicePort>();
    tokenService = mockDeep<TokenServicePort>();
    repo = mockDeep<UserRepositoryPort>();
    audit = mockDeep<AuditPort>();
    logger = mockDeep<LoggerPort>();
    useCase = new AuthenticateUserUseCase(service, tokenService, repo, audit, logger);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should authenticate via service', async () => {
    repo.findByEmail.mockResolvedValue(user);
    service.authenticate.mockResolvedValue(user);
    tokenService.generateAccessToken.mockReturnValue('t');
    tokenService.generateRefreshToken.mockResolvedValue('r');

    const result = await useCase.execute('john@example.com', 'secret');

    expect(result).toEqual({ user, token: 't', refreshToken: 'r' });
    expect(repo.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(service.authenticate).toHaveBeenCalledWith('john@example.com', 'secret');
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(user);
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(user);
    expect(repo.update).toHaveBeenCalledWith(user);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });

  it('should reject when account locked', async () => {
    user.lockedUntil = new Date(Date.now() + 1000);
    repo.findByEmail.mockResolvedValue(user);
    await expect(useCase.execute('john@example.com', 'secret')).rejects.toThrow('Account temporarily locked');
  });

  it('should lock account after too many failures', async () => {
    process.env.LOCK_ACCOUNT_ON_LOGIN_FAIL = 'true';
    repo.findByEmail.mockResolvedValue(user);
    user.failedLoginAttempts = 5;
    service.authenticate.mockRejectedValue(new Error('bad'));
    await expect(useCase.execute('john@example.com', 'bad')).rejects.toThrow('bad');
    expect(repo.update.mock.calls[0][0].lockedUntil).toBeInstanceOf(Date);
    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
  });

  it('should record failed attempt without locking', async () => {
    process.env.LOCK_ACCOUNT_ON_LOGIN_FAIL = 'true';
    repo.findByEmail.mockResolvedValue(user);
    user.failedLoginAttempts = 1;
    service.authenticate.mockRejectedValue(new Error('bad'));
    await expect(useCase.execute('john@example.com', 'bad')).rejects.toThrow('bad');
    expect(repo.update.mock.calls[0][0].failedLoginAttempts).toBe(2);
    expect(repo.update.mock.calls[0][0].lockedUntil).toBeNull();
    expect(audit.log).toHaveBeenCalledWith(expect.any(AuditEvent));
  });

  it('should reset counters after success', async () => {
    repo.findByEmail.mockResolvedValue(user);
    user.failedLoginAttempts = 2;
    user.lastFailedLoginAt = new Date();
    service.authenticate.mockResolvedValue(user);
    tokenService.generateAccessToken.mockReturnValue('t');
    tokenService.generateRefreshToken.mockResolvedValue('r');
    const result = await useCase.execute('john@example.com', 'secret');
    expect(result.token).toBe('t');
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lastFailedLoginAt).toBeNull();
    expect(user.lockedUntil).toBeNull();
    expect(repo.update).toHaveBeenCalledWith(user);
  });

  it('should not update counters when user not found', async () => {
    process.env.LOCK_ACCOUNT_ON_LOGIN_FAIL = 'true';
    repo.findByEmail.mockResolvedValue(null);
    service.authenticate.mockRejectedValue(new Error('bad'));
    await expect(useCase.execute('missing@example.com', 'bad')).rejects.toThrow('bad');
    expect(repo.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
