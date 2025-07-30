/**
 * Abstraction for real-time communication methods used by the application.
 */
export interface RealtimePort {
  /**
   * Emit an event to a specific client or room.
   *
   * Implementations should deliver the event only to the targeted
   * recipient(s), similar to socket.io's `emit`.
   *
   * @param event - Name identifying the event to send.
   * @param payload - Data associated with the event.
   */
  emit(event: string, payload: unknown): Promise<void>;

  /**
   * Broadcast an event to all connected clients.
   *
   * Implementations should deliver the event to every subscriber or
   * connected client.
   *
   * @param event - Name identifying the broadcast event.
   * @param payload - Data associated with the event.
   */
  broadcast(event: string, payload: unknown): Promise<void>;
}
