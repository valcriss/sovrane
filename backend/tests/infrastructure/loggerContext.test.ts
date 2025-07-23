import { withContext, getContext } from '../../infrastructure/loggerContext';

describe('logger context utilities', () => {
  it('should store and retrieve context', () => {
    expect(getContext()).toBeUndefined();
    const result = withContext({ requestId: '1' }, () => getContext());
    expect(result).toEqual({ requestId: '1' });
    expect(getContext()).toBeUndefined();
  });
});
