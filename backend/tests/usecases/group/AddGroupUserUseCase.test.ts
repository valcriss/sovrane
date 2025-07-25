import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AddGroupUserUseCase } from '../../../usecases/group/AddGroupUserUseCase';
import { UserGroupRepositoryPort } from '../../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';

describe('AddGroupUserUseCase', () => {
  let groupRepo: DeepMockProxy<UserGroupRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let useCase: AddGroupUserUseCase;
  let checker: PermissionChecker;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach(() => {
    groupRepo = mockDeep<UserGroupRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    const actor = new User(
      'actor',
      'Act',
      'Or',
      'a@b.c',
      [role],
      'active',
      dept,
      site,
      undefined,
      [new Permission('p', PermissionKeys.MANAGE_GROUP_MEMBERS, '')],
    );
    checker = new PermissionChecker(actor);
    useCase = new AddGroupUserUseCase(groupRepo, userRepo, checker);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', [user], [user]);
  });

  it('should add user to group', async () => {
    const other = new User('u2', 'Jane', 'Doe', 'jane@example.com', [role], 'active', dept, site);
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(other);
    groupRepo.addUser.mockResolvedValue(group);
    const result = await useCase.execute('g', 'u2');
    expect(result).toBe(group);
    expect(groupRepo.addUser).toHaveBeenCalledWith('g', 'u2');
  });

  it('should return null when group or user is missing', async () => {
    groupRepo.findById.mockResolvedValue(null);
    userRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute('g', 'u');

    expect(result).toBeNull();
    expect(groupRepo.addUser).not.toHaveBeenCalled();
  });
});
