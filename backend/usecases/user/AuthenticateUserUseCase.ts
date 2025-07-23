import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case for authenticating a user using login and password.
 */
export class AuthenticateUserUseCase {
  constructor(private readonly authService: AuthServicePort) {}

  /**
   * Execute the authentication.
   *
   * @param email - User email used for login.
   * @param password - User password.
   * @returns The authenticated {@link User}.
   */
  async execute(email: string, password: string): Promise<User> {
    return this.authService.authenticate(email, password);
  }
}
