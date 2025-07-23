import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveUserUseCase } from '../../../usecases/user/RemoveUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';

describe('RemoveUserUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let useCase: RemoveUserUseCase;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    useCase = new RemoveUserUseCase(repository);
  });

  it('should delete user via repository', async () => {
    await useCase.execute('user-1');

    expect(repository.delete).toHaveBeenCalledWith('user-1');
  });
});
