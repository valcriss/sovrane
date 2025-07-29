import { mockDeep } from 'jest-mock-extended';
import { SetupTotpUseCase } from '../../../usecases/user/SetupTotpUseCase';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('SetupTotpUseCase', () => {
  let mfa: ReturnType<typeof mockDeep<MfaServicePort>>;
  let useCase: SetupTotpUseCase;
  let user: User;

  beforeEach(() => {
    mfa = mockDeep<MfaServicePort>();
    useCase = new SetupTotpUseCase(mfa);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
  });

  it('should generate totp secret', async () => {
    mfa.generateTotpSecret.mockResolvedValue('secret');
    await expect(useCase.execute(user)).resolves.toBe('secret');
    expect(mfa.generateTotpSecret).toHaveBeenCalledWith(user);
  });
});
