import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RequestPasswordResetUseCase } from '../../../usecases/user/RequestPasswordResetUseCase';
import { AuthServicePort } from '../../../domain/ports/AuthServicePort';

describe('RequestPasswordResetUseCase', () => {
  let service: DeepMockProxy<AuthServicePort>;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    service = mockDeep<AuthServicePort>();
    useCase = new RequestPasswordResetUseCase(service);
  });

  it('should request password reset via service', async () => {
    await useCase.execute('john@example.com');

    expect(service.requestPasswordReset).toHaveBeenCalledWith('john@example.com');
  });
});
