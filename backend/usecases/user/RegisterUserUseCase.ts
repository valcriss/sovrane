import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case responsible for registering a new {@link User}
 * and issuing authentication tokens.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  /**
   * Execute the use case.
   *
   * @param user - The user to persist.
   * @returns The registered user profile and tokens.
   */
  async execute(user: User): Promise<{ user: User; token: string; refreshToken: string }> {
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
