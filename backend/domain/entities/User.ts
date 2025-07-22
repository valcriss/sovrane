import { Role } from './Role';

export class User {
  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public roles: Role[] = [],
    public status: 'active' | 'suspended' | 'archived' = 'active',
  ) {}
}