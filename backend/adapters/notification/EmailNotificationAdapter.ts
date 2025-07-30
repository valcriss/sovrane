import { NotificationPort } from '../../domain/ports/NotificationPort';
import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Notification adapter sending messages via {@link EmailServicePort}.
 */
export class EmailNotificationAdapter implements NotificationPort {
  /**
   * Create a new adapter instance.
   *
   * @param emailService - Email service used to deliver messages.
   * @param logger - Logger used to report errors.
   */
  constructor(
    private readonly emailService: EmailServicePort,
    private readonly logger: LoggerPort,
  ) {}

  /** @inheritdoc */
  async notify(recipients: string[], subject: string, message: string): Promise<void> {
    for (const to of recipients) {
      try {
        await this.emailService.sendMail({ to, subject, text: message });
      } catch (err) {
        this.logger.error(`Failed to send notification email to ${to}`, {
          ...getContext(),
          error: err,
        });
      }
    }
  }
}
