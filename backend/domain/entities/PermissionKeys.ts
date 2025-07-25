/**
 * Central registry of all permission keys used by the application.
 */
export class PermissionKeys {
  /** Grants all other permissions. */
  static readonly ROOT = 'root';

  /** Allows listing user accounts. */
  static readonly READ_USERS = 'read-users';
}
