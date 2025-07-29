import { OtpStorePort } from '../../../domain/ports/OtpStorePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

class InMemoryOtpStore implements OtpStorePort {
  private data = new Map<string, { otp: string; expires: number }>();

  async store(user: User, otp: string, ttlSeconds: number): Promise<void> {
    this.data.set(user.id, { otp, expires: Date.now() + ttlSeconds * 1000 });
  }

  async verify(user: User, otp: string): Promise<boolean> {
    const entry = this.data.get(user.id);
    if (!entry || entry.expires < Date.now() || entry.otp !== otp) {
      return false;
    }
    this.data.delete(user.id);
    return true;
  }

  async delete(user: User): Promise<void> {
    this.data.delete(user.id);
  }
}

describe('OtpStorePort Interface', () => {
  let store: InMemoryOtpStore;
  let user: User;

  beforeEach(() => {
    store = new InMemoryOtpStore();
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store and verify otp', async () => {
    await store.store(user, '111', 5);
    expect(await store.verify(user, '111')).toBe(true);
  });

  it('should fail verification on wrong code', async () => {
    await store.store(user, '111', 5);
    expect(await store.verify(user, '222')).toBe(false);
  });

  it('should expire otp', async () => {
    await store.store(user, '111', 1);
    jest.advanceTimersByTime(1100);
    expect(await store.verify(user, '111')).toBe(false);
  });
});
