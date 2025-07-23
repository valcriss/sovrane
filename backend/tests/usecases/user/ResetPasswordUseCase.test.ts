import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ResetPasswordUseCase } from '../../../usecases/user/ResetPasswordUseCase';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';

describe('ResetPasswordUseCase', () => {
  let service: DeepMockProxy<AuthServicePort>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    service = mockDeep<AuthServicePort>();
    useCase = new ResetPasswordUseCase(service);
  });

  it('should reset password via service', async () => {
    await useCase.execute('token', 'new');

    expect(service.resetPassword).toHaveBeenCalledWith('token', 'new');
  });
});
