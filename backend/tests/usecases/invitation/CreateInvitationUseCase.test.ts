import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateInvitationUseCase } from '../../../usecases/invitation/CreateInvitationUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { InvitationRepositoryPort } from '../../../domain/ports/InvitationRepositoryPort';
import { EmailServicePort } from '../../../domain/ports/EmailServicePort';
import { Invitation } from '../../../domain/entities/Invitation';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { User } from '../../../domain/entities/User';
import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';

describe('CreateInvitationUseCase', () => {
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let invitationRepo: DeepMockProxy<InvitationRepositoryPort>;
  let email: DeepMockProxy<EmailServicePort>;
  let checker: DeepMockProxy<PermissionChecker>;
  let useCase: CreateInvitationUseCase;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach(() => {
    userRepo = mockDeep<UserRepositoryPort>();
    invitationRepo = mockDeep<InvitationRepositoryPort>();
    email = mockDeep<EmailServicePort>();
    checker = mockDeep<PermissionChecker>();
    useCase = new CreateInvitationUseCase(userRepo, invitationRepo, email, checker);
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@test.com', [role], 'active', dept, site);
  });

  it('should create invitation and send mail', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    invitationRepo.findByEmail.mockResolvedValue(null);
    invitationRepo.create.mockImplementation(async i => i);

    const result = await useCase.execute({ email: 'new@test.com' });

    expect(checker.check).toHaveBeenCalledWith(PermissionKeys.CREATE_INVITATION);
    expect(result.email).toBe('new@test.com');
    expect(invitationRepo.create).toHaveBeenCalled();
    expect(email.sendMail).toHaveBeenCalledWith({
      to: 'new@test.com',
      subject: 'Account invitation',
      text: expect.stringContaining(result.token),
    });
  });

  it('should throw when user exists', async () => {
    userRepo.findByEmail.mockResolvedValue(user);
    await expect(useCase.execute({ email: 'john@test.com' })).rejects.toThrow('User already exists');
  });

  it('should throw when invitation exists', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    invitationRepo.findByEmail.mockResolvedValue(new Invitation('a', 't', 'pending', new Date()));
    await expect(useCase.execute({ email: 'a' })).rejects.toThrow('Invitation already exists');
  });
});
