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

  async revokeAll(userId: string): Promise<void> {
    for (const [id, t] of this.tokens.entries()) {
      if (t.userId === userId) {
        this.tokens.delete(id);
      }
    }
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

  it('should revoke all tokens of a user', async () => {
    const otherUserToken = new RefreshToken('2', 'u', 't2', new Date());
    const untouched = new RefreshToken('3', 'x', 'tx', new Date());
    await repo.save(token);
    await repo.save(otherUserToken);
    await repo.save(untouched);
    await repo.revokeAll('u');
    expect(await repo.findValidByToken('t')).toBeNull();
    expect(await repo.findValidByToken('t2')).toBeNull();
    expect(await repo.findValidByToken('tx')).toEqual(untouched);
  });

  it('should handle revokeAll with no tokens', async () => {
    await repo.revokeAll('none');
    expect(await repo.findValidByToken('t')).toBeNull();
  });
});
