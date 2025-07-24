import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';
import nodemailer, { Transporter, TransportOptions } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import Email from 'email-templates';

/**
 * Nodemailer-based implementation of {@link EmailServicePort} supporting
 * template rendering via the `email-templates` package.
 */
export class NodemailerEmailServiceAdapter implements EmailServicePort {
  private readonly transporter: Transporter;
  private readonly templater: Email;

  /**
   * Create a new adapter instance.
   *
   * @param smtpConfig - Nodemailer transport configuration.
   * @param templatesDir - Directory containing email templates.
   * @param logger - Application logger instance.
   */
  constructor(
    smtpConfig: TransportOptions,
    templatesDir: string,
    private readonly logger: LoggerPort,
  ) {
    this.transporter = nodemailer.createTransport(smtpConfig);
    this.templater = new Email({
      message: {},
      transport: this.transporter,
      views: { root: templatesDir },
    });
  }

  /** @inheritdoc */
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
    const { to, subject, template, variables, text, html, attachments } = options;
    try {
      if (template) {
        await this.templater.send({
          template,
          message: {
            to,
            subject,
            attachments: attachments as Mail.Attachment[] | undefined,
          },
          locals: variables,
        });
      } else {
        await this.transporter.sendMail({
          to,
          subject,
          text: text ?? undefined,
          html: html ?? undefined,
          attachments: attachments as Mail.Attachment[] | undefined,
        });
      }
      this.logger.info(`Email sent to ${to}`, getContext());
    } catch (err) {
      this.logger.error('Failed to send email', { ...getContext(), error: err });
      throw err;
    }
  }
}
