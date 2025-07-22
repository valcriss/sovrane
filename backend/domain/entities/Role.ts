/**
 * Describes a role that can be assigned to a user.
 */
export class Role {
  /**
   * Construct a new {@link Role} instance.
   *
   * @param id - Unique identifier of the role.
   * @param label - Human readable label for the role.
   */
  constructor(
    public readonly id: string,
    public label: string,
  ) {}
}

