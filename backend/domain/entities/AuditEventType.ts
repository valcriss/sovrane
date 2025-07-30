/**
 * Enumerates the different audit event identifiers used within the system.
 * Each constant represents the `action` value recorded on an {@link AuditEvent}.
 */
export class AuditEventType {
  /** Event recorded when a user updates their profile information. */
  static readonly USER_PROFILE_UPDATED = 'user.updateProfile';

  /** Event recorded when a refresh token is exchanged for a new one. */
  static readonly AUTH_REFRESH = 'auth.refresh';

  /** Event recorded when a user account becomes locked after failed attempts. */
  static readonly USER_ACCOUNT_LOCKED = 'user.accountLocked';

  /** Event recorded when a user fails to authenticate. */
  static readonly USER_LOGIN_FAILED = 'user.loginFailed';

  /** Event recorded when a configuration entry is created. */
  static readonly CONFIG_CREATED = 'config.created';

  /** Event recorded when a configuration entry is updated. */
  static readonly CONFIG_UPDATED = 'config.updated';

  /** Event recorded when a configuration entry is deleted. */
  static readonly CONFIG_DELETED = 'config.deleted';

  /** Event recorded when a sensitive route is accessed. */
  static readonly SENSITIVE_ROUTE_ACCESSED = 'sensitiveRoute.accessed';

  /** Event recorded when a security alert is triggered. */
  static readonly SECURITY_ALERT = 'security.alert';
}
