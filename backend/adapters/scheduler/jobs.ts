import { ScheduledJob } from '../../domain/ports/SchedulerPort';
import { DummyCronUseCase } from '../../usecases/cron/DummyCronUseCase';
import { ConsoleLoggerAdapter } from '../logger/ConsoleLoggerAdapter';
import { SendPasswordExpiryWarningsUseCase } from '../../usecases/SendPasswordExpiryWarningsUseCase';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { GetConfigUseCase } from '../../usecases/config/GetConfigUseCase';

const logger = new ConsoleLoggerAdapter();
const dummyUseCase = new DummyCronUseCase(logger);

/**
 * Build the array of scheduled jobs using provided dependencies.
 *
 * @param deps - Required use case dependencies.
 * @returns List of cron jobs to register.
 */
export function createScheduledJobs(deps: {
  userRepository: UserRepositoryPort;
  mailer: EmailServicePort;
  config: GetConfigUseCase;
}): ScheduledJob[] {
  const warningUseCase = new SendPasswordExpiryWarningsUseCase(
    deps.userRepository,
    deps.mailer,
    deps.config,
  );

  return [
    {
      name: 'DummyJob',
      schedule: '0 * * * *', // every hour
      handler: () => dummyUseCase.execute(),
    },
    {
      name: 'PasswordExpiryWarning',
      schedule: '0 12 * * *',
      handler: () => warningUseCase.execute(),
    },
  ];
}
