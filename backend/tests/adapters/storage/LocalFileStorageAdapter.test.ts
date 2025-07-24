import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalFileStorageAdapter } from '../../../adapters/storage/LocalFileStorageAdapter';
import { ConsoleLoggerAdapter } from '../../../adapters/logger/ConsoleLoggerAdapter';

describe('LocalFileStorageAdapter', () => {
  const dir = mkdtempSync(join(tmpdir(), 'store-'));
  const logger = new ConsoleLoggerAdapter();
  const adapter = new LocalFileStorageAdapter(dir, logger);

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should upload and download file', async () => {
    const data = Buffer.from('hello');
    await adapter.upload(data, 'a/b.txt');
    const loaded = await adapter.download('a/b.txt');
    expect(loaded.toString()).toBe('hello');
    expect((await adapter.getPublicUrl('a/b.txt')).endsWith('a/b.txt')).toBe(true);
  });

  it('should delete file', async () => {
    await adapter.upload(Buffer.from('x'), 'c.txt');
    await adapter.delete('c.txt');
    await expect(adapter.download('c.txt')).rejects.toThrow();
  });
});
