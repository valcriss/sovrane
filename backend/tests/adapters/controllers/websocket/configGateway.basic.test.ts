import { registerConfigGateway } from '../../../../adapters/controllers/websocket/configGateway';

describe('ConfigGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerConfigGateway).toBe('function');
  });
});
