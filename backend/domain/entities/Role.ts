/**
 * Describes a role that can be assigned to a user.
 */
import { Permission } from './Permission';

export class Role {
  /**
   * Construct a new {@link Role} instance.
   *
   * @param id - Unique identifier of the role.
   * @param label - Human readable label for the role.
   * @param permissions - Collection of {@link Permission} associated with the role.
   */
  constructor(
    public readonly id: string,
    public label: string,
    public permissions: Permission[] = [],
  ) {}
}

