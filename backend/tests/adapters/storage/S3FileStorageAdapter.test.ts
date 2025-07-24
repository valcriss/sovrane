import { Readable } from 'stream';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3FileStorageAdapter } from '../../../adapters/storage/S3FileStorageAdapter';
import { ConsoleLoggerAdapter } from '../../../adapters/logger/ConsoleLoggerAdapter';

describe('S3FileStorageAdapter', () => {
  const send = jest.fn();
  const client = { send } as unknown as S3Client;
  const logger = new ConsoleLoggerAdapter();
  const adapter = new S3FileStorageAdapter(client, 'bucket', logger);

  beforeEach(() => {
    send.mockReset();
  });

  it('should upload file', async () => {
    await adapter.upload(Buffer.from('d'), 'p');
    expect(send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it('should upload public file', async () => {
    await adapter.upload(Buffer.from('d'), 'pub', { public: true });
    expect(send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it('should download file', async () => {
    send.mockResolvedValue({ Body: Readable.from([Buffer.from("hi")]) } as any);
    const data = await adapter.download('p');
    expect(data.toString()).toBe('hi');
    expect(send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
  });

  it('should handle string chunks', async () => {
    send.mockResolvedValue({ Body: Readable.from('abc') } as any);
    const data = await adapter.download('p');
    expect(data.toString()).toBe('abc');
  });

  it('should delete file', async () => {
    await adapter.delete('p');
    expect(send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
  });
});
