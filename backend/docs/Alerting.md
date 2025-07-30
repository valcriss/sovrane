# Security Alerts

The backend can detect suspicious login activity by analyzing audit logs. When too many lockouts or failed logins occur in a short period, an alert is raised.

## AppConfig keys

- `lockout_alert_threshold` – number of account lock events before an alert.
- `failed_login_alert_threshold` – number of failed logins before an alert.
- `failed_login_time_window` – time window in minutes used for the check.

When a threshold is exceeded, administrators receive an email and an audit entry with action `security.alert` is recorded.
