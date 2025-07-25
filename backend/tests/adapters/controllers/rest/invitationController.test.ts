import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createInvitationRouter } from '../../../../adapters/controllers/rest/invitationController';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { InvitationRepositoryPort } from '../../../../domain/ports/InvitationRepositoryPort';
import { EmailServicePort } from '../../../../domain/ports/EmailServicePort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Invitation } from '../../../../domain/entities/Invitation';
import { User } from '../../../../domain/entities/User';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Invitation REST controller', () => {
  let app: express.Express;
  let auth: DeepMockProxy<AuthServicePort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let invitationRepo: DeepMockProxy<InvitationRepositoryPort>;
  let email: DeepMockProxy<EmailServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;

  beforeEach(() => {
    auth = mockDeep<AuthServicePort>();
    userRepo = mockDeep<UserRepositoryPort>();
    invitationRepo = mockDeep<InvitationRepositoryPort>();
    email = mockDeep<EmailServicePort>();
    logger = mockDeep<LoggerPort>();
    
    // Mock auth verification and user retrieval
    auth.verifyToken.mockResolvedValue({ id: 'user-id' } as any);
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const role = new Role('r', 'Role');
    // Create user with invitation permissions
    const mockUser = new User(
      'user-id', 
      'Test', 
      'User', 
      'test@test.com', 
      [role], 
      'active', 
      dept, 
      site,
      undefined,
      [
        new Permission('p1', PermissionKeys.CREATE_INVITATION, 'Can create invitations')
      ]
    );
    userRepo.findById.mockResolvedValue(mockUser);

    app = express();
    app.use(express.json());
    app.use(
      '/api',
      createInvitationRouter(auth, userRepo, invitationRepo, email, logger),
    );
  });

  it('should create invitation', async () => {
    invitationRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null as any);
    invitationRepo.create.mockImplementation(async (i) => i);

    const res = await request(app)
      .post('/api/invitations/invite')
      .set('Authorization', 'Bearer token')
      .send({ email: 'new@test.com' });

    expect(res.status).toBe(201);
    expect(invitationRepo.create).toHaveBeenCalled();
    expect(email.sendMail).toHaveBeenCalled();
  });

  it('should return 409 when invitation exists', async () => {
    invitationRepo.findByEmail.mockResolvedValue(
      new Invitation('a', 't', 'pending', new Date()),
    );

    const res = await request(app)
      .post('/api/invitations/invite')
      .set('Authorization', 'Bearer token')
      .send({ email: 'a' });

    expect(res.status).toBe(409);
  });

  it('should get invitation info', async () => {
    invitationRepo.findByToken.mockResolvedValue(
      new Invitation('a', 't', 'pending', new Date(Date.now() + 1000)),
    );

    const res = await request(app).get('/api/invitations/invite/t');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a');
  });

  it('should return 404 when invitation not found', async () => {
    invitationRepo.findByToken.mockResolvedValue(null);

    const res = await request(app).get('/api/invitations/invite/none');

    expect(res.status).toBe(404);
  });
});
