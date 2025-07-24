/**
 * Defines the contract for sending email messages, optionally using templates.
 */
export interface EmailServicePort {
  /**
   * Send an email message.
   *
   * The message can be created from a template stored in the configured
   * templates directory. When a template is provided the `variables` map is
   * used to render the final HTML and text versions.
   *
   * When no template is supplied the raw `text` or `html` properties are used
   * as the message body.
   *
   * @param options - Email sending options.
   * @param options.to - Recipient email address.
   * @param options.subject - Email subject line.
   * @param options.template - Optional template name located under the templates
   * folder.
   * @param options.variables - Variables passed to the template renderer.
   * @param options.text - Fallback plain text body when not using templates.
   * @param options.html - Fallback HTML body when not using templates.
   * @param options.attachments - Additional email attachments.
   */
  sendMail(options: {
    to: string;
    subject: string;
    template?: string;
    variables?: Record<string, unknown>;
    text?: string;
    html?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments?: any[];
  }): Promise<void>;
}
