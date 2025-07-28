import { CachePort } from '../../domain/ports/CachePort';
import IORedis from 'ioredis';

/**
 * Redis-backed cache storing values as JSON.
 */
export class RedisCacheAdapter implements CachePort {
  private readonly prefix = 'appconfig:';

  constructor(private readonly client: IORedis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(this.prefix + key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const val = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(this.prefix + key, val, 'EX', ttlSeconds);
    } else {
      await this.client.set(this.prefix + key, val);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.prefix + key);
  }

  async clear(pattern = '*'): Promise<void> {
    const stream = this.client.scanStream({ match: this.prefix + pattern });
    const pipeline = this.client.pipeline();
    await new Promise((resolve) => {
      stream.on('data', (keys: string[]) => {
        keys.forEach((k) => pipeline.del(k));
      });
      stream.on('end', resolve);
    });
    if (pipeline.length) {
      await pipeline.exec();
    }
  }
}
