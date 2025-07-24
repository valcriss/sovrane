import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GetRoleUseCase } from '../../../usecases/role/GetRoleUseCase';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { Role } from '../../../domain/entities/Role';

describe('GetRoleUseCase', () => {
  let repository: DeepMockProxy<RoleRepositoryPort>;
  let useCase: GetRoleUseCase;
  let role: Role;

  beforeEach(() => {
    repository = mockDeep<RoleRepositoryPort>();
    useCase = new GetRoleUseCase(repository);
    role = new Role('r', 'Role');
  });

  it('should return role by id', async () => {
    repository.findById.mockResolvedValue(role);

    const result = await useCase.execute('r');

    expect(result).toBe(role);
    expect(repository.findById).toHaveBeenCalledWith('r');
  });
});
