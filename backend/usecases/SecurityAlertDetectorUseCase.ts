import { AuditPort } from '../domain/ports/AuditPort';
import { GetConfigUseCase } from './config/GetConfigUseCase';
import { LoggerPort } from '../domain/ports/LoggerPort';
import { SecurityAlert } from '../domain/entities/SecurityAlert';
import { AppConfigKeys } from '../domain/entities/AppConfigKeys';
import { AuditEventType } from '../domain/entities/AuditEventType';

/**
 * Detects suspicious activity in audit logs and returns security alerts
 * when configured thresholds are exceeded.
 */
export class SecurityAlertDetectorUseCase {
  constructor(
    private readonly audit: AuditPort,
    private readonly config: GetConfigUseCase,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Check recent audit events for account lockouts and failed logins.
   *
   * @returns Array of alerts that were triggered, empty if none.
   */
  async execute(): Promise<SecurityAlert[]> {
    this.logger.debug('Checking security alerts');
    const lockoutThreshold =
      (await this.config.execute<number>(AppConfigKeys.LOCKOUT_ALERT_THRESHOLD)) ??
      5;
    const failedThreshold =
      (await this.config.execute<number>(
        AppConfigKeys.FAILED_LOGIN_ALERT_THRESHOLD,
      )) ?? 10;
    const windowMinutes =
      (await this.config.execute<number>(AppConfigKeys.FAILED_LOGIN_TIME_WINDOW)) ??
      15;

    const dateFrom = new Date(Date.now() - windowMinutes * 60 * 1000);

    const lockouts = await this.audit.findPaginated({
      page: 1,
      limit: 1,
      action: AuditEventType.USER_ACCOUNT_LOCKED,
      dateFrom,
    });
    const failed = await this.audit.findPaginated({
      page: 1,
      limit: 1,
      action: AuditEventType.USER_LOGIN_FAILED,
      dateFrom,
    });

    const alerts: SecurityAlert[] = [];
    if (lockouts.total > lockoutThreshold) {
      alerts.push({
        type: 'lockout',
        count: lockouts.total,
        threshold: lockoutThreshold,
        window: windowMinutes * 60,
      });
    }
    if (failed.total > failedThreshold) {
      alerts.push({
        type: 'failedLogin',
        count: failed.total,
        threshold: failedThreshold,
        window: windowMinutes * 60,
      });
    }

    if (alerts.length > 0) {
      this.logger.info('Security alerts detected', { alerts });
    } else {
      this.logger.debug('No security alerts detected');
    }

    return alerts;
  }
}
