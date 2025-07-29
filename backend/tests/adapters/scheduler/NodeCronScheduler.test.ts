import cron from 'node-cron';
import { NodeCronScheduler } from '../../../adapters/scheduler/NodeCronScheduler';
import { LoggerPort } from '../../../domain/ports/LoggerPort';
import { mockDeep } from 'jest-mock-extended';

jest.mock('node-cron', () => ({ schedule: jest.fn() }));

describe('NodeCronScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should execute registered job', async () => {
    const scheduleMock = cron.schedule as unknown as jest.Mock;
    const logger = mockDeep<LoggerPort>();
    const scheduler = new NodeCronScheduler(logger);
    const handler = jest.fn();

    scheduler.registerJobs([{ name: 'test', schedule: '* * * * *', handler }]);

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const cb = scheduleMock.mock.calls[0][1] as () => Promise<void>;
    await cb();
    expect(handler).toHaveBeenCalled();
  });

  it('should log error when job throws', async () => {
    const scheduleMock = cron.schedule as unknown as jest.Mock;
    const logger = mockDeep<LoggerPort>();
    const scheduler = new NodeCronScheduler(logger);
    const handler = jest.fn().mockRejectedValue(new Error('boom'));

    scheduler.registerJobs([{ name: 'test', schedule: '* * * * *', handler }]);

    const cb = scheduleMock.mock.calls[0][1] as () => Promise<void>;
    await cb();
    expect(logger.error).toHaveBeenCalledWith('[Scheduler] Job test failed', { error: expect.any(Error) });
  });

  it('should log registration error', () => {
    const scheduleMock = cron.schedule as unknown as jest.Mock;
    scheduleMock.mockImplementationOnce(() => { throw new Error('bad'); });
    const logger = mockDeep<LoggerPort>();
    const scheduler = new NodeCronScheduler(logger);

    scheduler.registerJobs([{ name: 'fail', schedule: '* * * * *', handler: jest.fn() }]);

    expect(logger.error).toHaveBeenCalledWith('[Scheduler] Failed to register job fail', { error: expect.any(Error) });
  });
});
