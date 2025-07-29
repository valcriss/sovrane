import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';
import { RefreshToken } from '../../../domain/entities/RefreshToken';

class MockRefreshTokenRepository implements RefreshTokenPort {
  private tokens: Map<string, RefreshToken> = new Map();

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async findValidByToken(token: string): Promise<RefreshToken | null> {
    for (const t of this.tokens.values()) {
      if (t.tokenHash === token) return t;
    }
    return null;
  }

  async markAsUsed(): Promise<void> {
    // no-op for mock
  }

  async revoke(_id: string): Promise<void> {
    this.tokens.delete(_id);
  }
}

describe('RefreshTokenPort Interface', () => {
  let repo: MockRefreshTokenRepository;
  let token: RefreshToken;

  beforeEach(() => {
    repo = new MockRefreshTokenRepository();
    token = new RefreshToken('1', 'u', 't', new Date());
  });

  it('should create and retrieve a token', async () => {
    await repo.save(token);
    expect(await repo.findValidByToken('t')).toEqual(token);
  });

  it('should delete a token', async () => {
    await repo.save(token);
    await repo.revoke(token.id);
    expect(await repo.findValidByToken('t')).toBeNull();
  });
});
