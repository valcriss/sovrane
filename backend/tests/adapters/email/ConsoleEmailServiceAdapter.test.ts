import { ConsoleEmailServiceAdapter } from '../../../adapters/email/ConsoleEmailServiceAdapter';
import { mockDeep } from 'jest-mock-extended';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('ConsoleEmailServiceAdapter', () => {
  it('should log email sending', async () => {
    const logger = mockDeep<LoggerPort>();
    const adapter = new ConsoleEmailServiceAdapter(logger);
    await adapter.sendMail({ to: 'to@test.com', subject: 'sub', text: 'body' });
    expect(logger.info).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('body', undefined);
  });

  it('should log template usage', async () => {
    const logger = mockDeep<LoggerPort>();
    const adapter = new ConsoleEmailServiceAdapter(logger);
    await adapter.sendMail({
      to: 'to@test.com',
      subject: 'sub',
      template: 'tpl',
      html: '<p></p>',
    });
    expect(logger.debug).toHaveBeenCalledWith('Using template tpl', undefined);
    expect(logger.debug).toHaveBeenCalledWith('<p></p>', undefined);
  });

  it('should handle empty body gracefully', async () => {
    const logger = mockDeep<LoggerPort>();
    const adapter = new ConsoleEmailServiceAdapter(logger);
    await adapter.sendMail({ to: 'x', subject: 's' });
    expect(logger.info).toHaveBeenCalled();
  });
});
