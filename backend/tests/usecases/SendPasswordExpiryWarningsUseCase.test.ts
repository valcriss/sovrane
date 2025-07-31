import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SendPasswordExpiryWarningsUseCase } from '../..//usecases/SendPasswordExpiryWarningsUseCase';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { EmailServicePort } from '../../domain/ports/EmailServicePort';
import { GetConfigUseCase } from '../../usecases/config/GetConfigUseCase';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { Department } from '../../domain/entities/Department';
import { Site } from '../../domain/entities/Site';

describe('SendPasswordExpiryWarningsUseCase', () => {
  const fixedDate = new Date('2024-01-01T00:00:00Z');
  let repo: DeepMockProxy<UserRepositoryPort>;
  let mailer: DeepMockProxy<EmailServicePort>;
  let config: DeepMockProxy<GetConfigUseCase>;
  let useCase: SendPasswordExpiryWarningsUseCase;
  let user: User;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fixedDate);
    repo = mockDeep<UserRepositoryPort>();
    mailer = mockDeep<EmailServicePort>();
    config = mockDeep<GetConfigUseCase>();
    useCase = new SendPasswordExpiryWarningsUseCase(repo, mailer, config);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should send warnings using defaults when config missing', async () => {
    config.execute.mockResolvedValue(null);
    user.passwordChangedAt = new Date(fixedDate.getTime() - 85 * 24 * 60 * 60 * 1000);
    repo.findUsersWithPasswordChangedBefore.mockResolvedValue([user]);

    await useCase.execute();

    const threshold = new Date(fixedDate);
    threshold.setDate(threshold.getDate() - (90 - 7));
    expect(repo.findUsersWithPasswordChangedBefore).toHaveBeenCalledWith(threshold);
    expect(mailer.sendMail).toHaveBeenCalledWith({
      to: user.email,
      subject: 'Votre mot de passe expire bientôt',
      template: 'password-expiry-warning',
      variables: { username: user.firstName, daysLeft: 5 },
    });
  });

  it('should not send when password already expired', async () => {
    config.execute.mockResolvedValue(null);
    user.passwordChangedAt = new Date(fixedDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    repo.findUsersWithPasswordChangedBefore.mockResolvedValue([user]);

    await useCase.execute();

    expect(mailer.sendMail).not.toHaveBeenCalled();
  });
});
