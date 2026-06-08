export class UserRevokedError extends Error {
  constructor() {
    super('User has been revoked');
  }
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum Permission {
  USERS_INVITE = 'users:invite',
  USERS_REVOKE = 'users:revoke',
  USERS_PROMOTE = 'users:promote',
  USERS_DEMOTE = 'users:demote',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.USERS_INVITE,
    Permission.USERS_REVOKE,
    Permission.USERS_PROMOTE,
    Permission.USERS_DEMOTE,
  ],
  [Role.USER]: [],
};

export interface UserSnapshot {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: string,
    private readonly _role: Role,
    private readonly _status: UserStatus,
    private readonly _createdAt: Date,
  ) {}

  static create(id: string, email: string, role: Role = Role.USER): User {
    return new User(id, email, role, UserStatus.ACTIVE, new Date());
  }

  static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(
      snapshot.id,
      snapshot.email,
      snapshot.role,
      snapshot.status,
      snapshot.createdAt,
    );
  }

  assertActive(): void {
    if (this._status === UserStatus.REVOKED) {
      throw new UserRevokedError();
    }
  }

  hasPermission(permission: Permission): boolean {
    return ROLE_PERMISSIONS[this._role].includes(permission);
  }

  promote(): User {
    if (this._status === UserStatus.REVOKED) {
      throw new Error('Cannot promote a revoked user');
    }
    return new User(this._id, this._email, Role.ADMIN, this._status, this._createdAt);
  }

  demote(): User {
    return new User(this._id, this._email, Role.USER, this._status, this._createdAt);
  }

  revoke(): User {
    return new User(this._id, this._email, this._role, UserStatus.REVOKED, this._createdAt);
  }

  snapshot(): UserSnapshot {
    return {
      id: this._id,
      email: this._email,
      role: this._role,
      status: this._status,
      createdAt: this._createdAt,
    };
  }
}
