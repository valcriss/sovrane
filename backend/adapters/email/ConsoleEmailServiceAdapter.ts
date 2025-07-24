import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Simple email service that logs messages to the console.
 */
export class ConsoleEmailServiceAdapter implements EmailServicePort {
  constructor(private readonly logger: LoggerPort) {}

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    this.logger.info(`Sending email to ${to} subject: ${subject}`, getContext());
    this.logger.debug(body, getContext());
  }
}
