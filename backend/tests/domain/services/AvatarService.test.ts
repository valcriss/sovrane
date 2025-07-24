import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AvatarService } from '../../../domain/services/AvatarService';
import { FileStoragePort } from '../../../domain/ports/FileStoragePort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Site } from '../../../domain/entities/Site';
import { Department } from '../../../domain/entities/Department';

describe('AvatarService', () => {
  let storage: DeepMockProxy<FileStoragePort>;
  let users: DeepMockProxy<UserRepositoryPort>;
  let logger: DeepMockProxy<LoggerPort>;
  let service: AvatarService;
  let user: User;

  beforeEach(() => {
    storage = mockDeep<FileStoragePort>();
    users = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    service = new AvatarService(storage, users, logger);
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'F', 'L', 'e', [], 'active', dept, site);
    users.findById.mockResolvedValue(user);
    users.update.mockResolvedValue(user);
    storage.getPublicUrl.mockResolvedValue('url');
  });

  it('should set avatar', async () => {
    await service.setUserAvatar('u', Buffer.from('a'), 'a.png');
    expect(storage.upload).toHaveBeenCalled();
    expect(users.update).toHaveBeenCalled();
  });

  it('should replace existing avatar', async () => {
    user.picture = 'old';
    await service.setUserAvatar('u', Buffer.from('a'), 'a.png');
    expect(storage.delete).toHaveBeenCalledWith('old');
  });

  it('should remove avatar', async () => {
    user.picture = 'path';
    await service.removeUserAvatar('u');
    expect(storage.delete).toHaveBeenCalledWith('path');
    expect(users.update).toHaveBeenCalled();
  });

  it('should handle remove when no picture', async () => {
    await service.removeUserAvatar('u');
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('should get avatar url', async () => {
    user.picture = 'path';
    const url = await service.getUserAvatarUrl('u');
    expect(url).toBe('url');
  });

  it('should fail when no avatar url', async () => {
    await expect(service.getUserAvatarUrl('u')).rejects.toThrow();
  });

  it('should get avatar file', async () => {
    user.picture = 'path';
    storage.download.mockResolvedValue(Buffer.from('x'));
    const buf = await service.getUserAvatar('u');
    expect(buf.toString()).toBe('x');
  });

  it('should fail when no avatar file', async () => {
    await expect(service.getUserAvatar('u')).rejects.toThrow();
  });

  it('should throw when user not found', async () => {
    users.findById.mockResolvedValueOnce(null);
    await expect(service.setUserAvatar('x', Buffer.from('a'), 'a.png')).rejects.toThrow('User not found');
  });
});
