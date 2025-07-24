/**
 * Manages user avatar files.
 */
export interface AvatarServicePort {
  /**
   * Store the avatar for a user.
   *
   * @param userId - Identifier of the user.
   * @param file - Avatar file content.
   * @param filename - Original filename.
   */
  setUserAvatar(userId: string, file: Buffer, filename: string): Promise<void>;

  /**
   * Remove the avatar for a user.
   *
   * @param userId - Identifier of the user.
   */
  removeUserAvatar(userId: string): Promise<void>;

  /**
   * Retrieve the avatar file for a user.
   *
   * @param userId - Identifier of the user.
   * @returns Avatar binary content.
   */
  getUserAvatar(userId: string): Promise<Buffer>;

  /**
   * Retrieve the public URL of a user's avatar.
   *
   * @param userId - Identifier of the user.
   * @returns URL pointing to the avatar image.
   */
  getUserAvatarUrl(userId: string): Promise<string>;
}
