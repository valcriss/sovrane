import { ConfigService } from './ConfigService';
import { AppConfigKeys } from '../entities/AppConfigKeys';
import { InvalidPasswordException } from '../errors/InvalidPasswordException';

/**
 * Utility responsible for validating password complexity according to
 * application configuration values.
 */
export class PasswordValidator {
  /**
   * Instantiate the validator.
   *
   * @param config - Service used to retrieve configuration values.
   */
  constructor(private readonly config: ConfigService) {}

  /**
   * Validate the provided password against configured rules.
   *
   * @param password - Password string to validate.
   * @throws {@link InvalidPasswordException} when validation fails.
   */
  async validate(password: string): Promise<void> {
    const minLength =
      (await this.config.get<number>(AppConfigKeys.ACCOUNT_PASSWORD_MIN_LENGTH)) ?? 8;
    const maxLength =
      (await this.config.get<number>(AppConfigKeys.ACCOUNT_PASSWORD_MAX_LENGTH)) ?? 30;
    const mustHaveUpper =
      (await this.config.get<boolean>(
        AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_UPPERCASE,
      )) ?? true;
    const mustHaveLower =
      (await this.config.get<boolean>(
        AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_LOWERCASE,
      )) ?? true;
    const mustHaveDigit =
      (await this.config.get<boolean>(AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_DIGIT)) ??
      true;
    const mustHaveSpecial =
      (await this.config.get<boolean>(
        AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_SPECIAL_CHAR,
      )) ?? true;

    if (password.length < minLength) {
      throw new InvalidPasswordException('Password too short');
    }
    if (password.length > maxLength) {
      throw new InvalidPasswordException('Password too long');
    }
    if (mustHaveUpper && !/[A-Z]/.test(password)) {
      throw new InvalidPasswordException('Password must contain an uppercase letter');
    }
    if (mustHaveLower && !/[a-z]/.test(password)) {
      throw new InvalidPasswordException('Password must contain a lowercase letter');
    }
    if (mustHaveDigit && !/[0-9]/.test(password)) {
      throw new InvalidPasswordException('Password must contain a digit');
    }
    if (mustHaveSpecial && !/[^A-Za-z0-9]/.test(password)) {
      throw new InvalidPasswordException('Password must contain a special character');
    }
  }
}
