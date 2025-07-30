import { registerUserGateway } from '../../../../adapters/controllers/websocket/userGateway';

describe('UserGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerUserGateway).toBe('function');
  });
});
