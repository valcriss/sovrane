export class Invitation {
  /**
   * Create a new invitation instance.
   *
   * @param email - Email address of the invitee.
   * @param token - Unique invitation token.
   * @param status - Current invitation status.
   * @param expiresAt - Expiration date of the token.
   * @param firstName - Optional first name of the invitee.
   * @param lastName - Optional last name of the invitee.
   * @param role - Optional role assigned after activation.
   */
  constructor(
    public readonly email: string,
    public readonly token: string,
    public status: 'pending' | 'accepted' | 'expired',
    public expiresAt: Date,
    public firstName?: string,
    public lastName?: string,
    public role?: string,
  ) {}
}
