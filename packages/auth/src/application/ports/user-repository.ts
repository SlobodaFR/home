import type { User } from '../../domain/index';

export interface UserPage {
  users: ReadonlyArray<User>;
  total: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findPage(offset: number, limit: number): Promise<UserPage>;
  countAdmins(): Promise<number>;
  exists(): Promise<boolean>;
  save(user: User): Promise<void>;
}
