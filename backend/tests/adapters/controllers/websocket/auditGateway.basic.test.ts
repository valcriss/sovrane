import { registerAuditGateway } from '../../../../adapters/controllers/websocket/auditGateway';

describe('AuditGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerAuditGateway).toBe('function');
  });
});
