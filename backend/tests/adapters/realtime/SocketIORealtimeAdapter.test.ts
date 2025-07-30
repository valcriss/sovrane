import { SocketIORealtimeAdapter } from '../../../adapters/realtime/SocketIORealtimeAdapter';
import { Server } from 'socket.io';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('SocketIORealtimeAdapter', () => {
  let io: DeepMockProxy<Server> & { to: jest.Mock };
  let logger: DeepMockProxy<LoggerPort>;
  let adapter: SocketIORealtimeAdapter;

  beforeEach(() => {
    io = {
      to: jest.fn(),
      emit: jest.fn(),
    } as unknown as DeepMockProxy<Server> & { to: jest.Mock };
    logger = mockDeep<LoggerPort>();
    adapter = new SocketIORealtimeAdapter(io as unknown as Server, logger);
  });

  it('should emit to specific socket', async () => {
    const target = { emit: jest.fn() };
    io.to.mockReturnValue(target as unknown as any);

    await adapter.emit('sock1', 'evt', { a: 1 });

    expect(io.to).toHaveBeenCalledWith('sock1');
    expect(target.emit).toHaveBeenCalledWith('evt', { a: 1 });
    expect(logger.debug).toHaveBeenCalledWith('Realtime emit to sock1 evt', undefined);
  });

  it('should emit using two-argument signature', async () => {
    await adapter.emit('evt2', { c: 3 });

    expect(io.emit).toHaveBeenCalledWith('evt2', { c: 3 });
    expect(logger.debug).toHaveBeenCalledWith('Realtime emit evt2', undefined);
  });

  it('should broadcast to all sockets', async () => {
    await adapter.broadcast('news', { b: 2 });

    expect(io.emit).toHaveBeenCalledWith('news', { b: 2 });
    expect(logger.debug).toHaveBeenCalledWith('Realtime broadcast news', undefined);
  });
});
