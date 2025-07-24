import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetPermissionsUseCase } from '../../../usecases/permission/GetPermissionsUseCase';
import { PermissionRepositoryPort } from '../../../domain/ports/PermissionRepositoryPort';
import { Permission } from '../../../domain/entities/Permission';

describe('GetPermissionsUseCase', () => {
  let repository: DeepMockProxy<PermissionRepositoryPort>;
  let useCase: GetPermissionsUseCase;
  let perm: Permission;

  beforeEach(() => {
    repository = mockDeep<PermissionRepositoryPort>();
    useCase = new GetPermissionsUseCase(repository);
    perm = new Permission('p', 'READ', 'desc');
  });

  it('should return permissions from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [perm], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([perm]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
