# Audit Logs

The backend records audit events for important actions. When certain routes are accessed, an `AuditEvent` is automatically stored.

## `audit_sensitive_routes`

The `audit_sensitive_routes` configuration key contains an array of path patterns. Any request matching one of these patterns is recorded with the action `sensitiveRoute.accessed`.

During bootstrap the following default patterns are set:

- `/api/admin/*`
- `/api/audit`
- `/api/config/*`

You can update this setting via the configuration endpoints to adapt which routes are considered sensitive.
