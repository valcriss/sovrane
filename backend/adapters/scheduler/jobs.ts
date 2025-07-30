import { ScheduledJob } from '../../domain/ports/SchedulerPort';
import { DummyCronUseCase } from '../../usecases/cron/DummyCronUseCase';
import { SendPasswordExpiryWarningsUseCase } from '../../usecases/SendPasswordExpiryWarningsUseCase';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { GetConfigUseCase } from '../../usecases/config/GetConfigUseCase';
import { AuditPort } from '../../domain/ports/AuditPort';
import { NotificationPort } from '../../domain/ports/NotificationPort';
import { SecurityAlertDetectorUseCase } from '../../usecases/SecurityAlertDetectorUseCase';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';
import { LoggerPort } from '../../domain/ports/LoggerPort';


/**
 * Build the array of scheduled jobs using provided dependencies.
 *
 * @param deps - Required use case dependencies.
 * @returns List of cron jobs to register.
 */
export function createScheduledJobs(deps: {
  userRepository: UserRepositoryPort;
  mailer: EmailServicePort;
  config: GetConfigUseCase;
  audit: AuditPort;
  notification: NotificationPort;
  logger: LoggerPort;
}): ScheduledJob[] {
  const warningUseCase = new SendPasswordExpiryWarningsUseCase(
    deps.userRepository,
    deps.mailer,
    deps.config,
  );
  const dummyUseCase = new DummyCronUseCase(deps.logger);
  const securityUseCase = new SecurityAlertDetectorUseCase(
    deps.audit,
    deps.config,
    deps.logger,
  );

  return [
    {
      name: 'DummyJob',
      schedule: '0 * * * *', // every hour
      handler: () => dummyUseCase.execute(),
    },
    {
      name: 'PasswordExpiryWarning',
      schedule: '0 12 * * *',
      handler: () => warningUseCase.execute(),
    },
    {
      name: 'SecurityAlertDetector',
      schedule: '*/5 * * * *',
      handler: async (): Promise<void> => {
        const alerts = await securityUseCase.execute();
        if (alerts.length > 0) {
          const lines = alerts.map((a) =>
            `${a.type}: ${a.count}/${a.threshold} in ${a.window}s`,
          );
          await deps.notification.notify(
            [process.env.ADMIN_EMAIL ?? 'admin@admin.com'],
            'Security alerts',
            lines.join('\n'),
          );
          await deps.audit.log(
            new AuditEvent(
              new Date(),
              null,
              'system',
              AuditEventType.SECURITY_ALERT,
              'security',
              undefined,
              { alerts },
            ),
          );
        }
      },
    },
  ];
}
