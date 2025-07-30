import { registerInvitationGateway } from '../../../../adapters/controllers/websocket/invitationGateway';

describe('InvitationGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerInvitationGateway).toBe('function');
  });
});
