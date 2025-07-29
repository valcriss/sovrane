import { mockDeep } from 'jest-mock-extended';
import { GenerateEmailOtpUseCase } from '../../../usecases/user/GenerateEmailOtpUseCase';
import { MfaServicePort } from '../../../domain/ports/MfaServicePort';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('GenerateEmailOtpUseCase', () => {
  let mfa: ReturnType<typeof mockDeep<MfaServicePort>>;
  let useCase: GenerateEmailOtpUseCase;
  let user: User;

  beforeEach(() => {
    mfa = mockDeep<MfaServicePort>();
    useCase = new GenerateEmailOtpUseCase(mfa);
    const role = new Role('r', 'Role');
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'A', 'B', 'a@example.com', [role], 'active', dept, site);
  });

  it('should generate email otp', async () => {
    mfa.generateEmailOtp.mockResolvedValue('123');
    await expect(useCase.execute(user)).resolves.toBe('123');
    expect(mfa.generateEmailOtp).toHaveBeenCalledWith(user);
  });

  it('should propagate errors', async () => {
    mfa.generateEmailOtp.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute(user)).rejects.toThrow('fail');
  });
});
