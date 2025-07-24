import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetRolesUseCase } from '../../../usecases/role/GetRolesUseCase';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { Role } from '../../../domain/entities/Role';

describe('GetRolesUseCase', () => {
  let repository: DeepMockProxy<RoleRepositoryPort>;
  let useCase: GetRolesUseCase;
  let role: Role;

  beforeEach(() => {
    repository = mockDeep<RoleRepositoryPort>();
    useCase = new GetRolesUseCase(repository);
    role = new Role('r', 'Role');
  });

  it('should return roles from repository', async () => {
    repository.findPage.mockResolvedValue({ items: [role], page: 1, limit: 20, total: 1 });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([role]);
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
