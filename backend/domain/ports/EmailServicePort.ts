/**
 * Defines the contract for sending email messages.
 */
export interface EmailServicePort {
  /**
   * Send an email message.
   *
   * @param to - Recipient email address.
   * @param subject - Email subject line.
   * @param body - Plain text body of the email.
   */
  sendMail(to: string, subject: string, body: string): Promise<void>;
}
