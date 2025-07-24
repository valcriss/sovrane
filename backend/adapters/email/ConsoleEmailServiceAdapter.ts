import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Simple email service that logs messages to the console.
 */
export class ConsoleEmailServiceAdapter implements EmailServicePort {
  constructor(private readonly logger: LoggerPort) {}

  async sendMail(options: {
    to: string;
    subject: string;
    template?: string;
    variables?: Record<string, unknown>;
    text?: string;
    html?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments?: any[];
  }): Promise<void> {
    const { to, subject, template, text, html } = options;
    this.logger.info(`Sending email to ${to} subject: ${subject}`, getContext());
    if (template) {
      this.logger.debug(`Using template ${template}`, getContext());
    }
    if (html) {
      this.logger.debug(html, getContext());
    } else if (text) {
      this.logger.debug(text, getContext());
    }
  }
}
