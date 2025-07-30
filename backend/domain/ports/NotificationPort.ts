/**
 * Generic notification service used to inform users of important events.
 * Implementations may deliver messages via email, chat or other channels.
 */
export interface NotificationPort {
  /**
   * Send a notification to a list of recipients.
   *
   * @param recipients - Array of recipient identifiers such as emails.
   * @param subject - Short subject describing the notification.
   * @param message - Body of the notification message.
   */
  notify(recipients: string[], subject: string, message: string): Promise<void>;
}
