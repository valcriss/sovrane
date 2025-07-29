import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PasswordValidator } from '../../../domain/services/PasswordValidator';
import { ConfigService } from '../../../domain/services/ConfigService';
import { AppConfigKeys } from '../../../domain/entities/AppConfigKeys';
import { InvalidPasswordException } from '../../../domain/errors/InvalidPasswordException';

describe('PasswordValidator', () => {
  let config: DeepMockProxy<ConfigService>;
  let validator: PasswordValidator;

  beforeEach(() => {
    config = mockDeep<ConfigService>();
    (config.get as jest.Mock).mockImplementation(async (key: string): Promise<unknown> => {
      switch (key) {
      case AppConfigKeys.ACCOUNT_PASSWORD_MIN_LENGTH:
        return 8;
      case AppConfigKeys.ACCOUNT_PASSWORD_MAX_LENGTH:
        return 12;
      case AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_UPPERCASE:
        return true;
      case AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_LOWERCASE:
        return true;
      case AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_DIGIT:
        return true;
      case AppConfigKeys.ACCOUNT_PASSWORD_MUST_HAVE_SPECIAL_CHAR:
        return true;
      default:
        return null;
      }
    });
    validator = new PasswordValidator(config);
  });

  it('should accept valid password', async () => {
    await expect(validator.validate('Valid1!A')).resolves.toBeUndefined();
  });

  it('should reject short password', async () => {
    await expect(validator.validate('V1!a')).rejects.toBeInstanceOf(InvalidPasswordException);
  });

  it('should reject long password', async () => {
    await expect(validator.validate('VeryLongPassword1!')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });

  it('should reject missing uppercase', async () => {
    await expect(validator.validate('valid1!a')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });

  it('should reject missing lowercase', async () => {
    await expect(validator.validate('VALID1!A')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });

  it('should reject missing digit', async () => {
    await expect(validator.validate('Valid!!A')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });

  it('should reject missing special char', async () => {
    await expect(validator.validate('Valid11A')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });
});
