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
    repository.findAll.mockResolvedValue([perm]);

    const result = await useCase.execute();

    expect(result).toEqual([perm]);
    expect(repository.findAll).toHaveBeenCalled();
  });
});
