import jwt from 'jsonwebtoken';
import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Authentication adapter for verifying internally issued JWT tokens.
 */
export class JWTAuthServiceAdapter implements AuthServicePort {
  /**
   * Create a new adapter instance.
   *
   * @param secret - Secret used to sign and verify tokens.
   * @param userRepository - Repository for retrieving users.
   */
  constructor(
    private readonly secret: string,
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async authenticate(email: string, _password: string): Promise<User> {
    void _password;
    this.logger.debug('Authenticating via JWT', getContext());
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    if (user.status === 'archived' || user.status === 'suspended') {
      throw new Error('User account is suspended or archived');
    }
    return user;
  }

  async authenticateWithProvider(_provider: string, _token: string): Promise<User> {
    void _provider;
    void _token;
    throw new Error('Not supported');
  }

  async requestPasswordReset(_email: string): Promise<void> {
    void _email;
    throw new Error('Not implemented');
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    void _token;
    void _newPassword;
    throw new Error('Not implemented');
  }

  async verifyToken(token: string): Promise<User> {
    this.logger.debug('Verifying JWT token', getContext());
    const payload = jwt.verify(token, this.secret) as jwt.JwtPayload;
    const userId = payload.sub as string;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Invalid token');
    }
    if (user.status === 'archived' || user.status === 'suspended') {
      throw new Error('User account is suspended or archived');
    }
    return user;
  }
}
