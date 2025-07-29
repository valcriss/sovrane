import { ScheduledJob } from '../../domain/ports/SchedulerPort';
import { DummyCronUseCase } from '../../usecases/cron/DummyCronUseCase';
import { ConsoleLoggerAdapter } from '../logger/ConsoleLoggerAdapter';

const logger = new ConsoleLoggerAdapter();
const dummyUseCase = new DummyCronUseCase(logger);

/** Array of jobs scheduled by the application. */
export const scheduledJobs: ScheduledJob[] = [
  {
    name: 'DummyJob',
    schedule: '0 * * * *', // every hour
    handler: () => dummyUseCase.execute(),
  },
];
