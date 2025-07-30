import { registerSiteGateway } from '../../../../adapters/controllers/websocket/siteGateway';

describe('SiteGateway export', () => {
  it('should export a register function', () => {
    expect(typeof registerSiteGateway).toBe('function');
  });
});
