import { registerGroupGateway } from '../../../../adapters/controllers/websocket/groupGateway';

describe('GroupGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerGroupGateway).toBe('function');
  });
});
