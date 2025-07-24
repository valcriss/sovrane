import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { FileStoragePort, FileUploadOptions } from '../../domain/ports/FileStoragePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';
import { Readable } from 'stream';

/**
 * File storage adapter backed by Amazon S3.
 */
export class S3FileStorageAdapter implements FileStoragePort {
  /**
   * Create a new adapter.
   *
   * @param client - AWS S3 client instance.
   * @param bucket - Bucket where files are stored.
   * @param logger - Logger for tracing operations.
   */
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly logger: LoggerPort,
  ) {}

  async upload(file: Buffer, path: string, options?: FileUploadOptions): Promise<string> {
    this.logger.debug(`Uploading ${path} to S3`, getContext());
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: file,
        ContentType: options?.contentType,
        ACL: options?.public ? 'public-read' : undefined,
      })
    );
    return this.getPublicUrl(path);
  }

  async download(path: string): Promise<Buffer> {
    this.logger.debug(`Downloading ${path} from S3`, getContext());
    const output = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: path })
    );
    const stream = output.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream as unknown as Array<Buffer | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(path: string): Promise<void> {
    this.logger.debug(`Deleting ${path} from S3`, getContext());
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: path })
    );
  }

  async getPublicUrl(path: string): Promise<string> {
    // Basic public URL assuming bucket is public or CloudFront configured
    return `https://${this.bucket}.s3.amazonaws.com/${path}`;
  }
}
