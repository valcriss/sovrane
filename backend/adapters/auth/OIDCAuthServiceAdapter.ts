import jwt from 'jsonwebtoken';
import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Authentication adapter for verifying tokens issued by an OpenID Connect provider.
 */
export class OIDCAuthServiceAdapter implements AuthServicePort {
  /**
   * Create a new adapter instance.
   *
   * @param publicKey - Public key used to verify tokens.
   * @param issuer - Expected token issuer.
   * @param userRepository - Repository for retrieving users.
   */
  constructor(
    private readonly secret: string,
    private readonly issuer: string,
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async authenticate(_email: string, _password: string): Promise<User> {
    void _email;
    void _password;
    this.logger.debug('authenticate not supported', getContext());
    throw new Error('Not supported');
  }

  async authenticateWithProvider(_provider: string, token: string): Promise<User> {
    this.logger.debug('Authenticating with OIDC token', getContext());
    return this.verifyToken(token);
  }

  async requestPasswordReset(_email: string): Promise<void> {
    void _email;
    this.logger.warn('requestPasswordReset not implemented', getContext());
    throw new Error('Not implemented');
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    void _token;
    void _newPassword;
    this.logger.warn('resetPassword not implemented', getContext());
    throw new Error('Not implemented');
  }

  async verifyToken(token: string): Promise<User> {
    this.logger.debug('Verifying OIDC token', getContext());
    const payload = jwt.verify(token, this.secret, {
      algorithms: ['HS256'],
      issuer: this.issuer,
    }) as jwt.JwtPayload;
    const userId = payload.sub as string;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Invalid token');
    }
    return user;
  }
}
