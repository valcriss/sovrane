import { EmailNotificationAdapter } from '../../../adapters/notification/EmailNotificationAdapter';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { EmailServicePort } from '../../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('EmailNotificationAdapter', () => {
  let email: DeepMockProxy<EmailServicePort>;
  let logger: DeepMockProxy<LoggerPort>;
  let adapter: EmailNotificationAdapter;

  beforeEach(() => {
    email = mockDeep<EmailServicePort>();
    logger = mockDeep<LoggerPort>();
    adapter = new EmailNotificationAdapter(email, logger);
  });

  it('should send an email to each recipient', async () => {
    await adapter.notify(['a@test.com', 'b@test.com'], 'Sub', 'msg');
    expect(email.sendMail).toHaveBeenCalledTimes(2);
    expect(email.sendMail).toHaveBeenCalledWith({ to: 'a@test.com', subject: 'Sub', text: 'msg' });
    expect(email.sendMail).toHaveBeenCalledWith({ to: 'b@test.com', subject: 'Sub', text: 'msg' });
  });

  it('should log error when sending fails', async () => {
    email.sendMail.mockRejectedValueOnce(new Error('boom'));
    await adapter.notify(['err@test.com'], 's', 'm');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to send notification email to err@test.com',
      { error: expect.any(Error) },
    );
  });
});
