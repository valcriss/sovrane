import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case for authenticating a user using login and password
 * and issuing authentication tokens.
 */
export class AuthenticateUserUseCase {
  constructor(
    private readonly authService: AuthServicePort,
    private readonly tokenService: TokenServicePort,
  ) {}

  /**
   * Execute the authentication.
   *
   * @param email - User email used for login.
   * @param password - User password.
   * @returns Authenticated user profile and tokens.
   */
  async execute(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    const user = await this.authService.authenticate(email, password);
    const token = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);
    return { user, token, refreshToken };
  }
}
