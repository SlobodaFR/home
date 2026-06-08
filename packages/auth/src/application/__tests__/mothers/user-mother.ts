import { Role, User, UserStatus, type UserSnapshot } from '../../../domain/index';

interface UserOverrides {
  id?: string;
  email?: string;
}

export class UserMother {
  static anAdmin(overrides: UserOverrides = {}): User {
    return User.fromSnapshot(UserMother.anAdminSnapshot(overrides));
  }

  static aUser(overrides: UserOverrides = {}): User {
    return User.fromSnapshot(UserMother.aUserSnapshot(overrides));
  }

  static anAdminSnapshot(overrides: UserOverrides = {}): UserSnapshot {
    return {
      id: 'admin-1',
      email: 'admin@example.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      ...overrides,
    };
  }

  static aUserSnapshot(overrides: UserOverrides = {}): UserSnapshot {
    return {
      id: 'user-1',
      email: 'user@example.com',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      ...overrides,
    };
  }
}
