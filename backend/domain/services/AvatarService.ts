import { randomUUID } from 'crypto';
import { FileStoragePort } from '../ports/FileStoragePort';
import { AvatarServicePort } from '../ports/AvatarServicePort';
import { UserRepositoryPort } from '../ports/UserRepositoryPort';
import { LoggerPort } from '../ports/LoggerPort';

/**
 * Service handling user avatar upload and retrieval.
 */
export class AvatarService implements AvatarServicePort {
  /**
   * Create a new service instance.
   *
   * @param storage - Storage adapter used to persist files.
   * @param users - Repository to update users with avatar URL.
   * @param logger - Logger instance.
   */
  constructor(
    private readonly storage: FileStoragePort,
    private readonly users: UserRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async setUserAvatar(userId: string, file: Buffer, filename: string): Promise<void> {
    this.logger.info('Setting user avatar');
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    const key = `avatars/${userId}/${Date.now()}_${randomUUID()}_${safeName}`;
    if (user.picture) {
      await this.storage.delete(user.picture);
    }
    const storedPath = await this.storage.upload(file, key, { contentType: 'image/png', public: true });
    user.picture = await this.storage.getPublicUrl(storedPath);
    await this.users.update(user);
  }

  async removeUserAvatar(userId: string): Promise<void> {
    this.logger.info('Removing user avatar');
    const user = await this.users.findById(userId);
    if (!user || !user.picture) {
      return;
    }
    await this.storage.delete(user.picture);
    user.picture = undefined;
    await this.users.update(user);
  }

  async getUserAvatar(userId: string): Promise<Buffer> {
    const user = await this.users.findById(userId);
    if (!user || !user.picture) {
      throw new Error('User not found or has no avatar');
    }
    return this.storage.download(user.picture);
  }

  async getUserAvatarUrl(userId: string): Promise<string> {
    const user = await this.users.findById(userId);
    if (!user || !user.picture) {
      throw new Error('User not found or has no avatar');
    }
    return this.storage.getPublicUrl(user.picture);
  }
}
