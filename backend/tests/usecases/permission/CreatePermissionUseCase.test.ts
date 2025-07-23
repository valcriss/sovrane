import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreatePermissionUseCase } from '../../../usecases/permission/CreatePermissionUseCase';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';

describe('CreatePermissionUseCase', () => {
  let repository: DeepMockProxy<PermissionRepositoryPort>;
  let useCase: CreatePermissionUseCase;
  let permission: Permission;

  beforeEach(() => {
    repository = mockDeep<PermissionRepositoryPort>();
    useCase = new CreatePermissionUseCase(repository);
    permission = new Permission('perm-1', 'READ', 'read');
  });

  it('should create a permission via repository', async () => {
    repository.create.mockResolvedValue(permission);

    const result = await useCase.execute(permission);

    expect(result).toBe(permission);
    expect(repository.create).toHaveBeenCalledWith(permission);
  });
});
