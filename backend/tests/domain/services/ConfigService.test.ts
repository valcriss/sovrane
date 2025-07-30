import { InMemoryCacheAdapter } from '../../../adapters/cache/InMemoryCacheAdapter';
import { ConfigService } from '../../../domain/services/ConfigService';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ConfigPort } from '../../../domain/ports/ConfigPort';
import { AppConfig } from '../../../domain/entities/AppConfig';

describe('ConfigService', () => {
  let cache: InMemoryCacheAdapter;
  let repo: DeepMockProxy<ConfigPort>;
  let service: ConfigService;

  beforeEach(() => {
    cache = new InMemoryCacheAdapter();
    repo = mockDeep<ConfigPort>();
    service = new ConfigService(cache, repo);
  });

  it('should return cached value', async () => {
    await cache.set('k', 'v');
    const val = await service.get<string>('k');
    expect(val).toBe('v');
    expect(repo.findByKey).not.toHaveBeenCalled();
  });

  it('should return null when missing', async () => {
    repo.findByKey.mockResolvedValue(null);
    const val = await service.get('unknown');
    expect(val).toBeNull();
  });

  it('should load from repository and cache result', async () => {
    const record = new AppConfig(1, 'num', '5', 'number', new Date(), 'u');
    repo.findByKey.mockResolvedValue(record);

    const val = await service.get<number>('num');

    expect(val).toBe(5);
    expect(await cache.get<number>('num')).toBe(5);
  });

  it('should load boolean and string values', async () => {
    repo.findByKey.mockResolvedValueOnce(new AppConfig(1, 'enabled', 'true', 'boolean', new Date(), 'u'));
    const boolVal = await service.get<boolean>('enabled');
    expect(boolVal).toBe(true);

    repo.findByKey.mockResolvedValueOnce(new AppConfig(2, 'name', 'John', 'string', new Date(), 'u'));
    const strVal = await service.get<string>('name');
    expect(strVal).toBe('John');
  });

  it('should parse json value from repository', async () => {
    const rec = new AppConfig(3, 'obj2', '{"b":2}', 'json', new Date(), 'u');
    repo.findByKey.mockResolvedValue(rec);

    const val = await service.get<{ b: number }>('obj2');

    expect(val).toEqual({ b: 2 });
  });

  it('should update repository and cache with boolean', async () => {
    const record = new AppConfig(1, 'flag', 'true', 'boolean', new Date(), 'u');
    repo.upsert.mockResolvedValue(record);

    await service.update('flag', true, 'u');

    expect(repo.upsert).toHaveBeenCalledWith('flag', 'true', 'boolean', 'u');
    expect(await cache.get<boolean>('flag')).toBe(true);
  });

  it('should update repository and cache with object', async () => {
    const record = new AppConfig(1, 'obj', '{"a":1}', 'json', new Date(), 'u');
    repo.upsert.mockResolvedValue(record);

    await service.update('obj', { a: 1 }, 'u');

    expect(repo.upsert).toHaveBeenCalledWith('obj', '{"a":1}', 'json', 'u');
    expect(await cache.get<{ a: number }>('obj')).toEqual({ a: 1 });
  });

  it('should update repository and cache with string', async () => {
    const record = new AppConfig(2, 'title', 'hello', 'string', new Date(), 'u');
    repo.upsert.mockResolvedValue(record);

    await service.update('title', 'hello', 'u');

    expect(repo.upsert).toHaveBeenCalledWith('title', 'hello', 'string', 'u');
    expect(await cache.get<string>('title')).toBe('hello');
  });

  it('should invalidate cache', async () => {
    await cache.set('k', 'v');
    await service.invalidate('k');
    expect(await cache.get('k')).toBeNull();
  });

  it('should return null when deleting unknown key', async () => {
    repo.findByKey.mockResolvedValue(null);
    const result = await service.delete('missing');
    expect(result).toBeNull();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('should delete existing config and invalidate cache', async () => {
    const record = new AppConfig(1, 'foo', 'bar', 'string', new Date(), 'u');
    repo.findByKey.mockResolvedValue(record);
    repo.delete.mockResolvedValue(record);
    await cache.set('foo', 'bar');

    const result = await service.delete('foo');

    expect(result).toBe(record);
    expect(repo.delete).toHaveBeenCalledWith('foo');
    expect(await cache.get('foo')).toBeNull();
  });
});
