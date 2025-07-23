import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UpdateRoleUseCase } from '../../../usecases/role/UpdateRoleUseCase';
import { RoleRepositoryPort } from '../../../domain/ports/RoleRepositoryPort';
import { Role } from '../../../domain/entities/Role';

describe('UpdateRoleUseCase', () => {
  let repository: DeepMockProxy<RoleRepositoryPort>;
  let useCase: UpdateRoleUseCase;
  let role: Role;

  beforeEach(() => {
    repository = mockDeep<RoleRepositoryPort>();
    useCase = new UpdateRoleUseCase(repository);
    role = new Role('role-1', 'Admin');
  });

  it('should update a role via repository', async () => {
    repository.update.mockResolvedValue(role);

    const result = await useCase.execute(role);

    expect(result).toBe(role);
    expect(repository.update).toHaveBeenCalledWith(role);
  });
});
