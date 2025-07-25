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

  /** Allows reading department information. */
  static readonly READ_DEPARTMENT = 'read-department';

  /** Allows listing departments. */
  static readonly READ_DEPARTMENTS = 'read-departments';

  /** Allows creating a department. */
  static readonly CREATE_DEPARTMENT = 'create-department';

  /** Allows updating department information. */
  static readonly UPDATE_DEPARTMENT = 'update-department';

  /** Allows deleting a department. */
  static readonly DELETE_DEPARTMENT = 'delete-department';

  /** Allows managing department users. */
  static readonly MANAGE_DEPARTMENT_USERS = 'manage-department-users';

  /** Allows managing department permissions. */
  static readonly MANAGE_DEPARTMENT_PERMISSIONS = 'manage-department-permissions';

  /** Allows managing department hierarchy. */
  static readonly MANAGE_DEPARTMENT_HIERARCHY = 'manage-department-hierarchy';

  /** Allows reading user group information. */
  static readonly READ_GROUP = 'read-group';

  /** Allows listing user groups. */
  static readonly READ_GROUPS = 'read-groups';

  /** Allows creating a user group. */
  static readonly CREATE_GROUP = 'create-group';

  /** Allows updating user group information. */
  static readonly UPDATE_GROUP = 'update-group';

  /** Allows deleting a user group. */
  static readonly DELETE_GROUP = 'delete-group';

  /** Allows managing group members. */
  static readonly MANAGE_GROUP_MEMBERS = 'manage-group-members';

  /** Allows managing group responsibles. */
  static readonly MANAGE_GROUP_RESPONSIBLES = 'manage-group-responsibles';

  /** Allows creating user invitations. */
  static readonly CREATE_INVITATION = 'create-invitation';
}
