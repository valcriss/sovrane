import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemovePermissionUseCase } from '../../../usecases/permission/RemovePermissionUseCase';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';

describe('RemovePermissionUseCase', () => {
  let repository: DeepMockProxy<PermissionRepositoryPort>;
  let useCase: RemovePermissionUseCase;

  beforeEach(() => {
    repository = mockDeep<PermissionRepositoryPort>();
    useCase = new RemovePermissionUseCase(repository);
  });

  it('should remove permission via repository', async () => {
    await useCase.execute('perm-1');

    expect(repository.delete).toHaveBeenCalledWith('perm-1');
  });
});
