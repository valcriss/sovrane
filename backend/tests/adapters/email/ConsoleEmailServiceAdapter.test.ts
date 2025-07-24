import { ConsoleEmailServiceAdapter } from '../../../adapters/email/ConsoleEmailServiceAdapter';
import { mockDeep } from 'jest-mock-extended';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('ConsoleEmailServiceAdapter', () => {
  it('should log email sending', async () => {
    const logger = mockDeep<LoggerPort>();
    const adapter = new ConsoleEmailServiceAdapter(logger);
    await adapter.sendMail('to@test.com', 'sub', 'body');
    expect(logger.info).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('body', undefined);
  });
});
