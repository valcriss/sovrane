/**
 * Represents an entry in the audit log recording a significant action.
 */
export class AuditEvent {
  /**
   * Create a new {@link AuditEvent} instance.
   *
   * @param timestamp - Date and time when the action occurred.
   * @param actorId - Identifier of the actor who performed the action, if any.
   * @param actorType - Nature of the actor, either 'user' or 'system'.
   * @param action - Description of the performed action.
   * @param targetType - Optional type of the entity affected by the action.
   * @param targetId - Optional identifier of the affected entity.
   * @param details - Arbitrary structured information describing the action.
   * @param ipAddress - Optional IP address from where the action originated.
   * @param userAgent - Optional user agent string associated with the request.
   */
  constructor(
    public timestamp: Date,
    public actorId: string | null,
    public actorType: 'user' | 'system',
    public action: string,
    public targetType?: string,
    public targetId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any,
    public ipAddress?: string,
    public userAgent?: string,
  ) {}
}
