import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { User } from '../../domain/entities/User';

/**
 * Authentication service that delegates verification to multiple underlying services.
 */
export class CompositeAuthService implements AuthServicePort {
  /**
   * @param services - Ordered list of authentication services to try.
   */
  constructor(private readonly services: AuthServicePort[]) {}

  async authenticate(email: string, password: string): Promise<User> {
    return this.services[0].authenticate(email, password);
  }

  async authenticateWithProvider(provider: string, token: string): Promise<User> {
    for (const service of this.services) {
      try {
        return await service.authenticateWithProvider(provider, token);
      } catch {
        // try next service
      }
    }
    throw new Error('Invalid credentials');
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.services[0].requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.services[0].resetPassword(token, newPassword);
  }

  async verifyToken(token: string): Promise<User> {
    for (const service of this.services) {
      try {
        return await service.verifyToken(token);
      } catch {
        // try next
      }
    }
    throw new Error('Invalid token');
  }
}
