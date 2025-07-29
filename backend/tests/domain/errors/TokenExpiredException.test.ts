import { TokenExpiredException } from '../../../domain/errors/TokenExpiredException';

describe('TokenExpiredException', () => {
  it('should use default message', () => {
    const err = new TokenExpiredException();
    expect(err.message).toBe('Token expired');
  });

  it('should use custom message', () => {
    const err = new TokenExpiredException('expired');
    expect(err.message).toBe('expired');
  });
});
