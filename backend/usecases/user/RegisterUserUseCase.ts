import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { User } from '../../domain/entities/User';
import { PasswordValidator } from '../../domain/services/PasswordValidator';
import { InvalidPasswordException } from '../../domain/errors/InvalidPasswordException';

/**
 * Use case responsible for registering a new {@link User}
 * and issuing authentication tokens.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenService: TokenServicePort,
    private readonly passwordValidator: PasswordValidator,
  ) {}

  /**
   * Execute the use case.
   *
   * @param user - The user to persist.
   * @returns The registered user profile and tokens.
   */
  async execute(
    user: User,
    password: string,
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    await this.passwordValidator.validate(password).catch((err) => {
      if (err instanceof InvalidPasswordException) {
        throw err;
      }
      throw new InvalidPasswordException(err.message);
    });
    user.createdAt = new Date();
    user.updatedAt = user.createdAt;
    user.createdBy = null;
    user.updatedBy = null;
    const created = await this.userRepository.create(user);
    const token = this.tokenService.generateAccessToken(created);
    const refreshToken = await this.tokenService.generateRefreshToken(created);
    return { user: created, token, refreshToken };
  }
}
