import { Site } from '../../../domain/entities/Site';

describe('Site Entity', () => {
  it('should construct a site with id and label', () => {
    const site = new Site('site-1', 'HQ');
    expect(site.id).toBe('site-1');
    expect(site.label).toBe('HQ');
  });

  it('should allow modifying the label', () => {
    const site = new Site('site-2', 'Paris');
    site.label = 'Lyon';
    expect(site.label).toBe('Lyon');
  });
});
