import { RefreshTokenRepositoryPort } from '../../../domain/ports/RefreshTokenRepositoryPort';
import { RefreshToken } from '../../../domain/entities/RefreshToken';

class MockRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private tokens: Map<string, RefreshToken> = new Map();

  async create(token: RefreshToken): Promise<RefreshToken> {
    this.tokens.set(token.token, token);
    return token;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.tokens.get(token) || null;
  }

  async delete(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}

describe('RefreshTokenRepositoryPort Interface', () => {
  let repo: MockRefreshTokenRepository;
  let token: RefreshToken;

  beforeEach(() => {
    repo = new MockRefreshTokenRepository();
    token = new RefreshToken('t', 'u', new Date());
  });

  it('should create and retrieve a token', async () => {
    await repo.create(token);
    expect(await repo.findByToken('t')).toEqual(token);
  });

  it('should delete a token', async () => {
    await repo.create(token);
    await repo.delete('t');
    expect(await repo.findByToken('t')).toBeNull();
  });
});
