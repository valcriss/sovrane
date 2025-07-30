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

  /** Allows listing roles. */
  static readonly READ_ROLES = 'read-roles';

  /** Allows reading role details. */
  static readonly READ_ROLE = 'read-role';

  /** Allows creating a role. */
  static readonly CREATE_ROLE = 'create-role';

  /** Allows updating role information. */
  static readonly UPDATE_ROLE = 'update-role';

  /** Allows deleting a role. */
  static readonly DELETE_ROLE = 'delete-role';

  /** Allows creating user invitations. */
  static readonly CREATE_INVITATION = 'create-invitation';

  /** Allows listing existing permissions. */
  static readonly READ_PERMISSIONS = 'read-permissions';

  /** Allows reading a single permission. */
  static readonly READ_PERMISSION = 'read-permission';

  /** Allows registering a new permission. */
  static readonly CREATE_PERMISSION = 'create-permission';

  /** Allows modifying an existing permission. */
  static readonly UPDATE_PERMISSION = 'update-permission';

  /** Allows deleting a permission. */
  static readonly DELETE_PERMISSION = 'delete-permission';

  /** Allows viewing audit log entries. */
  static readonly VIEW_AUDIT_LOGS = 'view_audit_logs';

  /** Allows managing multi-factor authentication. */
  static readonly MANAGE_MFA = 'manage-mfa';

  /** Allows updating user profile pictures. */
  static readonly UPDATE_USER_PICTURE = 'update-user-picture';

  /** Allows viewing the audit logging configuration. */
  static readonly READ_AUDIT_CONFIG = 'read-audit-config';

  /** Allows modifying the audit logging configuration. */
  static readonly WRITE_AUDIT_CONFIG = 'write-audit-config';

  /** Allows reading application configuration values. */
  static readonly READ_CONFIG = 'read-config';

  /** Allows updating application configuration values. */
  static readonly UPDATE_CONFIG = 'update-config';

  /** Allows deleting application configuration values. */
  static readonly DELETE_CONFIG = 'delete-config';

  /** Allows listing available sites. */
  static readonly READ_SITES = 'read-sites';

  /** Allows reading a single site. */
  static readonly READ_SITE = 'read-site';

  /** Allows creating, updating or deleting sites. */
  static readonly MANAGE_SITES = 'manage-sites';
}
