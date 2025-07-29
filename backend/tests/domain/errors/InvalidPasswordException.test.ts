import { InvalidPasswordException } from '../../../domain/errors/InvalidPasswordException';

describe('InvalidPasswordException', () => {
  it('should use default message when none provided', () => {
    const err = new InvalidPasswordException();
    expect(err.message).toBe('Password does not meet complexity requirements');
  });

  it('should use custom message when provided', () => {
    const err = new InvalidPasswordException('bad');
    expect(err.message).toBe('bad');
  });
});
