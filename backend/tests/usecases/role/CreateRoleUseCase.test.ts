import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateRoleUseCase } from '../../../usecases/role/CreateRoleUseCase';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { Role } from '../../../domain/entities/Role';

describe('CreateRoleUseCase', () => {
  let repository: DeepMockProxy<RoleRepositoryPort>;
  let useCase: CreateRoleUseCase;
  let role: Role;

  beforeEach(() => {
    repository = mockDeep<RoleRepositoryPort>();
    useCase = new CreateRoleUseCase(repository);
    role = new Role('role-1', 'Admin');
  });

  it('should create a role via repository', async () => {
    repository.create.mockResolvedValue(role);

    const result = await useCase.execute(role);

    expect(result).toBe(role);
    expect(repository.create).toHaveBeenCalledWith(role);
  });
});
