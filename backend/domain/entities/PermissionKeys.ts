/**
 * Central registry of all permission keys used by the application.
 */
export class PermissionKeys {
  /** Grants all other permissions. */
  static readonly ROOT = 'root';

  /** Allows listing user accounts. */
  static readonly READ_USERS = 'read-users';

  /** Allows reading a single user profile. */
  static readonly READ_USER = 'read-user';

  /** Allows creating a user account. */
  static readonly CREATE_USER = 'create-user';

  /** Allows updating user information. */
  static readonly UPDATE_USER = 'update-user';

  /** Allows deleting a user account. */
  static readonly DELETE_USER = 'delete-user';

  /** Allows creating a user session (login). */
  static readonly CREATE_SESSION = 'create-session';

  /** Allows requesting a password reset. */
  static readonly CREATE_PASSWORD_RESET = 'create-password-reset';

  /** Allows setting a new account password. */
  static readonly UPDATE_PASSWORD = 'update-password';
}
