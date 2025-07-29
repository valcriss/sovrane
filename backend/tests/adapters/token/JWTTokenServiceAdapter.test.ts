import jwt from 'jsonwebtoken';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { JWTTokenServiceAdapter } from '../../../adapters/token/JWTTokenServiceAdapter';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('JWTTokenServiceAdapter', () => {
  const secret = 'secret';
  let repo: DeepMockProxy<RefreshTokenPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let service: JWTTokenServiceAdapter;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<RefreshTokenPort>();
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
    const token = await service.generateRefreshToken(user, '1.1.1.1', 'agent');
    expect(repo.save).toHaveBeenCalled();
    const saved = repo.save.mock.calls[0][0];
    expect(saved.userId).toBe('u');
    expect(saved.ipAddress).toBe('1.1.1.1');
    expect(saved.userAgent).toBe('agent');
  });

  it('should parse duration units', async () => {
    const units = ['1s', '1m', '1h', '1d', '1w', '10', '1y'];
    for (const u of units) {
      const svc = new JWTTokenServiceAdapter(secret, repo, logger, '15m', u);
      await svc.generateRefreshToken(user, undefined, undefined);
    }
    expect(repo.save).toHaveBeenCalledTimes(units.length);
  });
});
