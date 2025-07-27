import { AuditEvent } from '../../../domain/entities/AuditEvent';

describe('AuditEvent', () => {
  it('should store provided properties', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const event = new AuditEvent(
      date,
      'actor',
      'user',
      'action',
      'target',
      'id',
      { key: 'value' },
      '127.0.0.1',
      'agent',
    );
    expect(event.timestamp).toBe(date);
    expect(event.actorId).toBe('actor');
    expect(event.actorType).toBe('user');
    expect(event.action).toBe('action');
    expect(event.targetType).toBe('target');
    expect(event.targetId).toBe('id');
    expect(event.details).toEqual({ key: 'value' });
    expect(event.ipAddress).toBe('127.0.0.1');
    expect(event.userAgent).toBe('agent');
  });
});
