import type { PrismaClient, User as UserRow } from '@prisma/client';
import { Role, User, UserStatus, type UserSnapshot } from '../../domain/index';
import type { UserPage, UserRepository } from '../../application/index';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | undefined> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? User.fromSnapshot(toSnapshot(row)) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? User.fromSnapshot(toSnapshot(row)) : undefined;
  }

  async findPage(offset: number, limit: number): Promise<UserPage> {
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({ skip: offset, take: limit, orderBy: { createdAt: 'asc' } }),
      this.prisma.user.count(),
    ]);
    return { users: rows.map((row) => User.fromSnapshot(toSnapshot(row))), total };
  }

  async countAdmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: Role.ADMIN } });
  }

  async exists(): Promise<boolean> {
    const row = await this.prisma.user.findFirst({ select: { id: true } });
    return row !== null;
  }

  async save(user: User): Promise<void> {
    const snapshot = user.snapshot();
    await this.prisma.user.upsert({
      where: { id: snapshot.id },
      create: snapshot,
      update: { email: snapshot.email, role: snapshot.role, status: snapshot.status },
    });
  }
}

function toSnapshot(row: UserRow): UserSnapshot {
  return {
    id: row.id,
    email: row.email,
    role: row.role as Role,
    status: row.status as UserStatus,
    createdAt: row.createdAt,
  };
}
