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
    repository.findAll.mockResolvedValue([role]);

    const result = await useCase.execute();

    expect(result).toEqual([role]);
    expect(repository.findAll).toHaveBeenCalled();
  });
});
