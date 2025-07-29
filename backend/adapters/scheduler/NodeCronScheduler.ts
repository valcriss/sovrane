import cron from 'node-cron';
import { SchedulerPort, ScheduledJob } from '../../domain/ports/SchedulerPort';
import { LoggerPort } from '../../domain/ports/LoggerPort';

/**
 * Scheduler adapter using the `node-cron` library.
 */
export class NodeCronScheduler implements SchedulerPort {
  /**
   * Create a new scheduler.
   *
   * @param logger - Logger used to output execution information.
   */
  constructor(private readonly logger: LoggerPort) {}

  registerJobs(jobs: ScheduledJob[]): void {
    for (const job of jobs) {
      try {
        cron.schedule(job.schedule, async () => {
          this.logger.info(`[Scheduler] Job ${job.name} started`);
          try {
            await job.handler();
            this.logger.info(`[Scheduler] Job ${job.name} completed`);
          } catch (err) {
            this.logger.error(`[Scheduler] Job ${job.name} failed`, { error: err });
          }
        });
        this.logger.info(`[Scheduler] Registered job ${job.name} (${job.schedule})`);
      } catch (err) {
        this.logger.error(`[Scheduler] Failed to register job ${job.name}`, { error: err });
      }
    }
  }
}
