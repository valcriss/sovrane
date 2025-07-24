import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { FileStoragePort, FileUploadOptions } from '../../domain/ports/FileStoragePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * File storage adapter using the local filesystem.
 */
export class LocalFileStorageAdapter implements FileStoragePort {
  /**
   * Create a new adapter.
   *
   * @param rootPath - Base directory where files will be stored.
   * @param logger - Logger instance.
   */
  constructor(private readonly rootPath: string, private readonly logger: LoggerPort) {}

  async upload(file: Buffer, path: string, options?: FileUploadOptions): Promise<string> {
    void options;
    const full = join(this.rootPath, path);
    this.logger.debug(`Uploading ${full} locally`, getContext());
    await fs.mkdir(dirname(full), { recursive: true });
    await fs.writeFile(full, file);
    return full;
  }

  async download(path: string): Promise<Buffer> {
    const full = join(this.rootPath, path);
    this.logger.debug(`Downloading ${full} locally`, getContext());
    return fs.readFile(full);
  }

  async delete(path: string): Promise<void> {
    const full = join(this.rootPath, path);
    this.logger.debug(`Deleting ${full} locally`, getContext());
    await fs.rm(full, { force: true });
  }

  async getPublicUrl(path: string): Promise<string> {
    return join(this.rootPath, path);
  }
}
