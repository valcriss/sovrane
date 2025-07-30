import { RealtimePort } from '../../../domain/ports/RealtimePort';

class MockRealtime implements RealtimePort {
  public emitted: { event: string; payload: unknown }[] = [];
  public broadcasted: { event: string; payload: unknown }[] = [];

  async emit(event: string, payload: unknown): Promise<void> {
    this.emitted.push({ event, payload });
  }

  async broadcast(event: string, payload: unknown): Promise<void> {
    this.broadcasted.push({ event, payload });
  }
}

describe('RealtimePort Interface', () => {
  it('should record emit and broadcast events', async () => {
    const rt = new MockRealtime();
    await rt.emit('ping', { a: 1 });
    await rt.broadcast('msg', { b: 2 });

    expect(rt.emitted).toEqual([{ event: 'ping', payload: { a: 1 } }]);
    expect(rt.broadcasted).toEqual([{ event: 'msg', payload: { b: 2 } }]);
  });
});
