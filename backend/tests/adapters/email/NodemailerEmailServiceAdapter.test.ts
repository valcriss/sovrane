import { NodemailerEmailServiceAdapter } from '../../../adapters/email/NodemailerEmailServiceAdapter';
import { mockDeep } from 'jest-mock-extended';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import nodemailer from 'nodemailer';
import Email from 'email-templates';

jest.mock('nodemailer');
jest.mock('email-templates');

describe('NodemailerEmailServiceAdapter', () => {
  const sendMailMock = jest.fn().mockResolvedValue(undefined);
  const sendTemplateMock = jest.fn().mockResolvedValue(undefined);
  const logger = mockDeep<LoggerPort>();
  const smtpConfig = {
    host: 'smtp.example.com',
    port: 587,
  };

  beforeEach(() => {
    (nodemailer.createTransport as unknown as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });
    (Email as unknown as jest.Mock).mockImplementation(() => ({
      send: sendTemplateMock,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should send using template when provided', async () => {
    const adapter = new NodemailerEmailServiceAdapter(smtpConfig, 'templates', logger);
    await adapter.sendMail({ to: 'a', subject: 's', template: 't', variables: { a: 1 } });
    expect(sendTemplateMock).toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('should send raw message when no template', async () => {
    const adapter = new NodemailerEmailServiceAdapter(smtpConfig, 'templates', logger);
    await adapter.sendMail({ to: 'a', subject: 's', text: 'b' });
    expect(sendMailMock).toHaveBeenCalled();
  });

  it('should handle html only body', async () => {
    const adapter = new NodemailerEmailServiceAdapter(smtpConfig, 'templates', logger);
    await adapter.sendMail({ to: 'a', subject: 's', html: '<p>hi</p>' });
    expect(sendMailMock).toHaveBeenCalled();
  });

  it('should send with attachments', async () => {
    const adapter = new NodemailerEmailServiceAdapter(smtpConfig, 'templates', logger);
    await adapter.sendMail({ to: 'a', subject: 's', text: 'b', attachments: [{}] });
    expect(sendMailMock).toHaveBeenCalled();
  });

  it('should log and rethrow on send error', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('boom'));
    const adapter = new NodemailerEmailServiceAdapter(smtpConfig, 'templates', logger);
    await expect(
      adapter.sendMail({ to: 'a', subject: 's', text: 'b' }),
    ).rejects.toThrow('boom');
    expect(logger.error).toHaveBeenCalled();
  });
});
