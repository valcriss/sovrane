import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case for authenticating a user with an external provider such as OIDC/Keycloak.
 */
export class AuthenticateWithProviderUseCase {
  constructor(private readonly authService: AuthServicePort) {}

  /**
   * Execute the authentication via provider.
   *
   * @param provider - Name of the external provider.
   * @param token - Authentication token from the provider.
   * @returns The authenticated {@link User}.
   */
  async execute(provider: string, token: string): Promise<User> {
    return this.authService.authenticateWithProvider(provider, token);
  }
}
