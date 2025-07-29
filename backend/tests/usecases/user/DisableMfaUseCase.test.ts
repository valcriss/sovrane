import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { DisableMfaUseCase } from '../../../usecases/user/DisableMfaUseCase';
import { UserRepositoryPort } from '../../../domain/ports/UserRepositoryPort';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('DisableMfaUseCase', () => {
  let repo: DeepMockProxy<UserRepositoryPort>;
  let mfa: DeepMockProxy<MfaServicePort>;
  let useCase: DisableMfaUseCase;
  let user: User;

  beforeEach(() => {
    repo = mockDeep<UserRepositoryPort>();
    mfa = mockDeep<MfaServicePort>();
    useCase = new DisableMfaUseCase(repo, mfa);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
    user.mfaEnabled = true;
    user.mfaType = 'email';
    user.mfaSecret = 'x';
    user.mfaRecoveryCodes = ['c'];
  });

  it('should disable mfa', async () => {
    repo.update.mockResolvedValue(user);
    await useCase.execute(user);
    expect(mfa.disableMfa).toHaveBeenCalledWith(user);
    expect(user.mfaEnabled).toBe(false);
    expect(user.mfaType).toBeNull();
    expect(user.mfaSecret).toBeNull();
    expect(user.mfaRecoveryCodes).toEqual([]);
    expect(repo.update).toHaveBeenCalledWith(user);
  });
});
