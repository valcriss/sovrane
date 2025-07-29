import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RegisterUserUseCase } from '../../../usecases/user/RegisterUserUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { PasswordValidator } from '../../../domain/services/PasswordValidator';
import { InvalidPasswordException } from '../../../domain/errors/InvalidPasswordException';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('RegisterUserUseCase', () => {
  let repository: DeepMockProxy<UserRepositoryPort>;
  let tokenService: DeepMockProxy<TokenServicePort>;
  let passwordValidator: DeepMockProxy<PasswordValidator>;
  let useCase: RegisterUserUseCase;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    repository = mockDeep<UserRepositoryPort>();
    tokenService = mockDeep<TokenServicePort>();
    passwordValidator = mockDeep<PasswordValidator>();
    useCase = new RegisterUserUseCase(repository, tokenService, passwordValidator);
    role = new Role('role-1', 'Admin');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User('user-1', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
  });

  it('should create a user via repository', async () => {
    repository.create.mockResolvedValue(user);
    tokenService.generateAccessToken.mockReturnValue('t');
    tokenService.generateRefreshToken.mockResolvedValue('r');

    passwordValidator.validate.mockResolvedValue();
    const result = await useCase.execute(user, 'Password1!');

    expect(result).toEqual({ user, token: 't', refreshToken: 'r' });
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.createdBy).toBeNull();
    expect(user.updatedBy).toBeNull();
    expect(passwordValidator.validate).toHaveBeenCalledWith('Password1!');
    expect(repository.create).toHaveBeenCalledWith(user);
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(user);
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(user);
  });

  it('should throw when password invalid', async () => {
    passwordValidator.validate.mockRejectedValue(new InvalidPasswordException('bad'));

    await expect(useCase.execute(user, 'bad')).rejects.toBeInstanceOf(
      InvalidPasswordException,
    );
  });

  it('should convert unknown validation errors', async () => {
    passwordValidator.validate.mockRejectedValue(new Error('unexpected'));

    await expect(useCase.execute(user, 'oops')).rejects.toEqual(
      new InvalidPasswordException('unexpected'),
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });
});
