import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ResetPasswordUseCase } from '../../../usecases/user/ResetPasswordUseCase';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { PasswordValidator } from '../../../domain/services/PasswordValidator';
import { InvalidPasswordException } from '../../../domain/errors/InvalidPasswordException';

describe('ResetPasswordUseCase', () => {
  let service: DeepMockProxy<AuthServicePort>;
  let validator: DeepMockProxy<PasswordValidator>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    service = mockDeep<AuthServicePort>();
    validator = mockDeep<PasswordValidator>();
    useCase = new ResetPasswordUseCase(service, validator);
  });

  it('should reset password via service', async () => {
    validator.validate.mockResolvedValue();
    await useCase.execute('token', 'newPass1!');

    expect(validator.validate).toHaveBeenCalledWith('newPass1!');
    expect(service.resetPassword).toHaveBeenCalledWith('token', 'newPass1!');
  });

  it('should throw when password invalid', async () => {
    validator.validate.mockRejectedValue(new InvalidPasswordException('bad'));

    await expect(useCase.execute('tok', 'bad')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });

  it('should wrap unexpected errors as InvalidPasswordException', async () => {
    validator.validate.mockRejectedValue(new Error('oops'));

    await expect(useCase.execute('tok', 'bad'))
      .rejects.toEqual(new InvalidPasswordException('oops'));
    expect(service.resetPassword).not.toHaveBeenCalled();
  });
});
