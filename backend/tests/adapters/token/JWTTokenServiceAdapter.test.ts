import jwt from 'jsonwebtoken';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { JWTTokenServiceAdapter } from '../../../adapters/token/JWTTokenServiceAdapter';
import { RefreshTokenRepositoryPort } from '../../../domain/ports/RefreshTokenRepositoryPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('JWTTokenServiceAdapter', () => {
  const secret = 'secret';
  let repo: DeepMockProxy<RefreshTokenRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let service: JWTTokenServiceAdapter;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<RefreshTokenRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    service = new JWTTokenServiceAdapter(secret, repo, logger, '15m', '7d');
  });

  it('should generate access token', () => {
    const token = service.generateAccessToken(user);
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    expect(payload.sub).toBe('u');
    expect(payload.email).toBe('john@example.com');
  });

  it('should generate refresh token and store it', async () => {
    const token = await service.generateRefreshToken(user);
    expect(repo.create).toHaveBeenCalled();
    const saved = repo.create.mock.calls[0][0];
    expect(saved.token).toBe(token);
    expect(saved.userId).toBe('u');
  });
});
