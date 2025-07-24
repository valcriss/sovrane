import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RemoveGroupUserUseCase } from '../../../usecases/userGroup/RemoveGroupUserUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RemoveGroupUserUseCase', () => {
  let groupRepo: DeepMockProxy<UserGroupRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: RemoveGroupUserUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach(() => {
    groupRepo = mockDeep<UserGroupRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    useCase = new RemoveGroupUserUseCase(groupRepo, userRepo);
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', user, [user]);
  });

  it('should remove user from group', async () => {
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(user);
    groupRepo.removeUser.mockResolvedValue(group);

    const result = await useCase.execute('g', 'u');

    expect(result).toBe(group);
    expect(groupRepo.removeUser).toHaveBeenCalledWith('g', 'u');
  });

  it('should return null when group or user missing', async () => {
    groupRepo.findById.mockResolvedValue(null);
    userRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute('g', 'u');

    expect(result).toBeNull();
    expect(groupRepo.removeUser).not.toHaveBeenCalled();
  });
});
