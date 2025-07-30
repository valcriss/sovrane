import { registerPermissionGateway } from '../../../../adapters/controllers/websocket/permissionGateway';

describe('PermissionGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerPermissionGateway).toBe('function');
  });
});
