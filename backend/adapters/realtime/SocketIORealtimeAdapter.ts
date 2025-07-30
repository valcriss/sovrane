import { Server } from 'socket.io';
import { RealtimePort } from '../../domain/ports/RealtimePort';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { getContext } from '../../infrastructure/loggerContext';

/**
 * Socket.IO implementation of {@link RealtimePort}.
 *
 * Provides methods to emit events to specific clients or broadcast
 * to all connected clients using a Socket.IO {@link Server} instance.
 */
export class SocketIORealtimeAdapter implements RealtimePort {
  /**
   * Create a new adapter bound to the provided Socket.IO server.
   *
   * @param io - Socket.IO server used to dispatch events.
   * @param logger - Logger instance for debug tracing.
   */
  constructor(
    private readonly io: Server,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Emit an event to a specific connected client.
   *
   * @param socketId - Identifier of the target socket.
   * @param event - Name of the event to emit.
   * @param payload - Data associated with the event.
   */
  async emit(socketId: string, event: string, payload: unknown): Promise<void>;
  /** @internal */
  async emit(event: string, payload: unknown): Promise<void>;
  async emit(a: string, b: unknown, c?: unknown): Promise<void> {
    if (c === undefined) {
      const event = a;
      const payload = b;
      this.logger.debug(`Realtime emit ${event}`, getContext());
      this.io.emit(event, payload);
    } else {
      const socketId = a;
      const event = b as string;
      const payload = c;
      this.logger.debug(`Realtime emit to ${socketId} ${event}`, getContext());
      this.io.to(socketId).emit(event, payload);
    }
  }

  /**
   * Broadcast an event to all connected clients.
   *
   * @param event - Name identifying the broadcast event.
   * @param payload - Data associated with the event.
   */
  async broadcast(event: string, payload: unknown): Promise<void> {
    this.logger.debug(`Realtime broadcast ${event}`, getContext());
    this.io.emit(event, payload);
  }
}
