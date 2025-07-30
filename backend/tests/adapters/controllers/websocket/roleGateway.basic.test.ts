import { registerRoleGateway } from '../../../../adapters/controllers/websocket/roleGateway';

describe('RoleGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerRoleGateway).toBe('function');
  });
});
