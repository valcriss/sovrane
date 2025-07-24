import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveUserGroupUseCase } from '../../../usecases/userGroup/RemoveUserGroupUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';

describe('RemoveUserGroupUseCase', () => {
  let repo: DeepMockProxy<UserGroupRepositoryPort>;
  let useCase: RemoveUserGroupUseCase;

  beforeEach(() => {
    repo = mockDeep<UserGroupRepositoryPort>();
    useCase = new RemoveUserGroupUseCase(repo);
  });

  it('should delete group via repository', async () => {
    await useCase.execute('g');

    expect(repo.delete).toHaveBeenCalledWith('g');
  });
});
