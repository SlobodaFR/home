import { User } from '../../../domain/index.js';
import type { UserRepository } from '../../ports/index.js';

export class FakeUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findById(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    return user ? User.fromSnapshot(user.snapshot()) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = [...this.users.values()].find((u) => u.snapshot().email === email);
    return user ? User.fromSnapshot(user.snapshot()) : undefined;
  }

  async countAdmins(): Promise<number> {
    return [...this.users.values()].filter((u) => u.snapshot().role === 'ADMIN').length;
  }

  async exists(): Promise<boolean> {
    return this.users.size > 0;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.snapshot().id, user);
  }

  getAll(): ReadonlyArray<User> {
    return [...this.users.values()];
  }
}
