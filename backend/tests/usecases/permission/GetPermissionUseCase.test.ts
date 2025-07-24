import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetPermissionUseCase } from '../../../usecases/permission/GetPermissionUseCase';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';

describe('GetPermissionUseCase', () => {
  let repository: DeepMockProxy<PermissionRepositoryPort>;
  let useCase: GetPermissionUseCase;
  let perm: Permission;

  beforeEach(() => {
    repository = mockDeep<PermissionRepositoryPort>();
    useCase = new GetPermissionUseCase(repository);
    perm = new Permission('p', 'READ', 'desc');
  });

  it('should return permission by id', async () => {
    repository.findById.mockResolvedValue(perm);

    const result = await useCase.execute('p');

    expect(result).toBe(perm);
    expect(repository.findById).toHaveBeenCalledWith('p');
  });
});
