import { UserRepositoryPort } from '../domain/ports/UserRepositoryPort';
import { EmailServicePort } from '../domain/ports/EmailServicePort';
import { GetConfigUseCase } from './config/GetConfigUseCase';
import { AppConfigKeys } from '../domain/entities/AppConfigKeys';

/**
 * Use case responsible for sending password expiry warning emails.
 */
export class SendPasswordExpiryWarningsUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly mailer: EmailServicePort,
    private readonly config: GetConfigUseCase,
  ) {}

  /**
   * Execute the warning sending process.
   */
  async execute(): Promise<void> {
    const expirationDays =
      (await this.config.execute<number>(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_AFTER)) ?? 90;
    const warningDays =
      (await this.config.execute<number>(AppConfigKeys.ACCOUNT_PASSWORD_EXPIRE_WARNING_DAYS)) ?? 7;

    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() - (expirationDays - warningDays));

    const users = await this.userRepository.findUsersWithPasswordChangedBefore(thresholdDate);
    for (const user of users) {
      const daysLeft = expirationDays - this.daysSince(user.passwordChangedAt);
      if (daysLeft > 0) {
        await this.mailer.sendMail({
          to: user.email,
          subject: 'Votre mot de passe expire bientôt',
          template: 'password-expiry-warning',
          variables: { username: user.firstName, daysLeft },
        });
      }
    }
  }

  private daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}
