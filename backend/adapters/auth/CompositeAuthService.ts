import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { User } from '../../domain/entities/User';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Authentication service that delegates verification to multiple underlying services.
 */
export class CompositeAuthService implements AuthServicePort {
  /**
   * @param services - Ordered list of authentication services to try.
   * @param logger - Logger used to record authentication attempts.
   */
  constructor(
    private readonly services: AuthServicePort[],
    private readonly logger: LoggerPort,
  ) {}

  async authenticate(email: string, password: string): Promise<User> {
    this.logger.info('Authenticating user', getContext());
    return this.services[0].authenticate(email, password);
  }

  async authenticateWithProvider(provider: string, token: string): Promise<User> {
    this.logger.info(`Authenticating with ${provider}`, getContext());
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
    this.logger.info('Requesting password reset', getContext());
    await this.services[0].requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    this.logger.info('Resetting password', getContext());
    await this.services[0].resetPassword(token, newPassword);
  }

  async verifyToken(token: string): Promise<User> {
    this.logger.debug('Verifying token', getContext());
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
