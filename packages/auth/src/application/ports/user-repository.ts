import type { User } from '../../domain/index';

export interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  countAdmins(): Promise<number>;
  exists(): Promise<boolean>;
  save(user: User): Promise<void>;
}
