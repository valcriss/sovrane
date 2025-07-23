import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdatePermissionUseCase } from '../../../usecases/permission/UpdatePermissionUseCase';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';

describe('UpdatePermissionUseCase', () => {
  let repository: DeepMockProxy<PermissionRepositoryPort>;
  let useCase: UpdatePermissionUseCase;
  let permission: Permission;

  beforeEach(() => {
    repository = mockDeep<PermissionRepositoryPort>();
    useCase = new UpdatePermissionUseCase(repository);
    permission = new Permission('perm-1', 'READ', 'read');
  });

  it('should update a permission via repository', async () => {
    repository.update.mockResolvedValue(permission);

    const result = await useCase.execute(permission);

    expect(result).toBe(permission);
    expect(repository.update).toHaveBeenCalledWith(permission);
  });
});
