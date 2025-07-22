/**
 * Represents a permission available in the system.
 */
export class Permission {
  /**
   * Create a new {@link Permission} instance.
   *
   * @param id - Unique identifier for the permission.
   * @param permissionKey - Key representing the permission.
   * @param description - Human readable description of the permission.
   */
  constructor(
    public readonly id: string,
    public permissionKey: string,
    public description: string
  ) {}
}
