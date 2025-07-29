import { PasswordExpiredException } from '../../../domain/errors/PasswordExpiredException';

describe('PasswordExpiredException', () => {
  it('should use default message', () => {
    const err = new PasswordExpiredException();
    expect(err.message).toBe('Password has expired');
  });

  it('should use custom message', () => {
    const err = new PasswordExpiredException('expired');
    expect(err.message).toBe('expired');
  });
});
