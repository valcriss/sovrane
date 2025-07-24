import { User } from './User';

/**
 * Represents a group of users.
 */
export class UserGroup {
  /**
   * Create a new {@link UserGroup}.
   *
   * @param id - Unique identifier for the group.
   * @param name - Group name.
   * @param responsibleUser - User responsible for the group.
   * @param members - Users belonging to the group.
   * @param description - Optional description of the group.
   */
  constructor(
    public readonly id: string,
    public name: string,
    public responsibleUser: User,
    public members: User[] = [],
    public description?: string,
  ) {}
}
