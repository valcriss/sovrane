/* istanbul ignore file */
import express, {Request, Response, Router} from 'express';
import {AuthServicePort} from '../../../domain/ports/AuthServicePort';
import {UserRepositoryPort} from '../../../domain/ports/UserRepositoryPort';
import {InvitationRepositoryPort} from '../../../domain/ports/InvitationRepositoryPort';
import {EmailServicePort} from '../../../domain/ports/EmailServicePort';
import {CreateInvitationUseCase} from '../../../usecases/invitation/CreateInvitationUseCase';
import {GetInvitationUseCase} from '../../../usecases/invitation/GetInvitationUseCase';
import {LoggerPort} from '../../../domain/ports/LoggerPort';
import {getContext} from '../../../infrastructure/loggerContext';
import {PermissionChecker} from '../../../domain/services/PermissionChecker';
import {User} from '../../../domain/entities/User';

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

interface AuthedRequest extends Request {
    user: User;
}

export function createInvitationRouter(
  authService: AuthServicePort,
  userRepository: UserRepositoryPort,
  invitationRepository: InvitationRepositoryPort,
  emailService: EmailServicePort,
  logger: LoggerPort,
): Router {
  const router = express.Router();

  /**
     * @openapi
     * /invitations/invite/{token}:
     *   get:
     *     summary: Get invitation information by token
     *     description: >
     *       Retrieves the invitation details linked to the provided token. Used to validate the invitation and pre-fill onboarding fields.
     *     tags: [Invitation]
     *     parameters:
     *       - in: path
     *         name: token
     *         required: true
     *         schema:
     *           type: string
     *         description: The invitation token from the activation link.
     *     responses:
     *       200:
     *         description: Invitation details and onboarding info.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 email:
     *                   type: string
     *                 firstName:
     *                   type: string
     *                 lastName:
     *                   type: string
     *                 role:
     *                   type: string
     *               required: [email]
     *       404:
     *         description: Invalid or expired invitation token.
     *       400:
     *         description: Invalid token parameter.
     */
  router.get('/invitations/invite/:token', async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /invitations/invite/:token', getContext());
    const {token} = req.params;
    if (!token) {
      res.status(400).end();
      return;
    }
    // No permission check needed for public invitation endpoint
    const useCase = new GetInvitationUseCase(invitationRepository);
    const invitation = await useCase.execute(token);
    if (!invitation) {
      logger.warn('Invitation not found', getContext());
      res.status(404).end();
      return;
    }
    logger.debug('Invitation retrieved', getContext());
    res.json({
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
    });
  });

  const authMiddleware: express.RequestHandler = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).end();
      return;
    }
    const token = header.slice(7);
    try {
      const claims = await authService.verifyToken(token);
      const user = await userRepository.findById(claims.id);
      if (!user) {
        res.status(401).end();
        return;
      }
      (req as AuthedRequest).user = user;
      next();
    } catch {
      res.status(401).end();
    }
  };

  router.use(authMiddleware);

  /**
     * @openapi
     * /invitations/invite:
     *   post:
     *     summary: Invite a new user by email
     *     description: >
     *       Sends an invitation email with an activation link to a new user. Only administrators can invite users.
     *     tags: [Invitation]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       description: Email and optional details for the invited user.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 description: Email address of the invitee.
     *               firstName:
     *                 type: string
     *                 description: First name (optional).
     *               lastName:
     *                 type: string
     *                 description: Last name (optional).
     *               role:
     *                 type: string
     *                 description: Role to assign after activation (optional).
     *             required:
     *               - email
     *     responses:
     *       201:
     *         description: Invitation sent successfully.
     *       409:
     *         description: User already exists or invitation already sent.
     *       400:
     *         description: Invalid request.
     *       401:
     *         description: Invalid or expired authentication token.
     */
  router.post('/invitations/invite', async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /invitations/invite', getContext());
    const {email, firstName, lastName, role} = req.body as {
            email?: string;
            firstName?: string;
            lastName?: string;
            role?: string;
        };
    if (!email) {
      res.status(400).end();
      return;
    }
    const checker = new PermissionChecker((req as AuthedRequest).user);
    const useCase = new CreateInvitationUseCase(
      userRepository,
      invitationRepository,
      emailService,
      checker,
    );
    try {
      const invitation = await useCase.execute({email, firstName, lastName, role});
      logger.debug('Invitation created', getContext());
      res.status(201).json({token: invitation.token});
    } catch (err) {
      if ((err as Error).message === 'Forbidden') {
        logger.warn('Permission denied creating invitation', {...getContext(), error: err});
        res.status(403).json({error: 'Forbidden'});
        return;
      }
      logger.warn('Invitation creation failed', {...getContext(), error: err});
      const msg = (err as Error).message;
      if (msg === 'User already exists' || msg === 'Invitation already exists') {
        res.status(409).end();
      } else {
        res.status(400).end();
      }
    }
  });

  return router;
}
