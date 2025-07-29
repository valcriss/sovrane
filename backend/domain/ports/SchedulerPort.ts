/**
 * Defines a cron job scheduled by the application.
 */
export type ScheduledJob = {
  /** Descriptive job name used in logs. */
  name: string;
  /** Cron expression specifying the execution schedule. */
  schedule: string;
  /** Function executed when the job triggers. */
  handler: () => Promise<void> | void;
};

/**
 * Scheduler port responsible for registering and executing cron jobs.
 */
export interface SchedulerPort {
  /**
   * Register and start a collection of scheduled jobs.
   *
   * @param jobs - Jobs to register with the scheduler.
   */
  registerJobs(jobs: ScheduledJob[]): void;
}
