import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ResetPasswordUseCase } from '../../../usecases/user/ResetPasswordUseCase';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';
import { PasswordValidator } from '../../../domain/services/PasswordValidator';
import { InvalidPasswordException } from '../../../domain/errors/InvalidPasswordException';
import { RefreshTokenPort } from '../../../domain/ports/RefreshTokenPort';

describe('ResetPasswordUseCase', () => {
  let service: DeepMockProxy<AuthServicePort>;
  let validator: DeepMockProxy<PasswordValidator>;
  let refreshRepo: DeepMockProxy<RefreshTokenPort>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    service = mockDeep<AuthServicePort>();
    validator = mockDeep<PasswordValidator>();
    refreshRepo = mockDeep<RefreshTokenPort>();
    useCase = new ResetPasswordUseCase(service, validator, refreshRepo);
  });

  it('should reset password via service', async () => {
    validator.validate.mockResolvedValue();
    await useCase.execute('u1', 'token', 'newPass1!');

    expect(validator.validate).toHaveBeenCalledWith('newPass1!');
    expect(service.resetPassword).toHaveBeenCalledWith('token', 'newPass1!');
    expect(refreshRepo.revokeAll).toHaveBeenCalledWith('u1');
  });

  it('should throw when password invalid', async () => {
    validator.validate.mockRejectedValue(new InvalidPasswordException('bad'));

    await expect(useCase.execute('u1', 'tok', 'bad')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
    expect(refreshRepo.revokeAll).not.toHaveBeenCalled();
  });

  it('should wrap unexpected errors as InvalidPasswordException', async () => {
    validator.validate.mockRejectedValue(new Error('oops'));

    await expect(useCase.execute('u1', 'tok', 'bad'))
      .rejects.toEqual(new InvalidPasswordException('oops'));
    expect(service.resetPassword).not.toHaveBeenCalled();
    expect(refreshRepo.revokeAll).not.toHaveBeenCalled();
  });
});
