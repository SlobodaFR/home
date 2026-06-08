import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../../../prisma/migrations', import.meta.url));

export type TestDatabase = {
  prisma: PrismaClient;
  disconnect: () => Promise<void>;
};

/**
 * Creates an isolated SQLite database in the OS temp dir, applies the migration SQL directly
 * through the connected PrismaClient (avoiding the Prisma CLI subprocess which cannot share
 * an in-memory database with the test process), and returns a handle with a `disconnect` that
 * also removes the temp file.
 */
export async function createMigratedTestDatabase(): Promise<TestDatabase> {
  const dbPath = join(tmpdir(), `auth-test-${randomUUID()}.db`);
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } },
  });
  await prisma.$connect();
  for (const statement of await readMigrationStatements()) {
    await prisma.$executeRawUnsafe(statement);
  }
  return {
    prisma,
    disconnect: async () => {
      await prisma.$disconnect();
      await unlink(dbPath).catch(() => {});
    },
  };
}

async function readMigrationStatements(): Promise<ReadonlyArray<string>> {
  const directories = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const statements: string[] = [];
  for (const directory of directories) {
    const sql = await readFile(`${MIGRATIONS_DIR}/${directory}/migration.sql`, 'utf8');
    const withoutComments = sql
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');
    statements.push(
      ...withoutComments
        .split(';')
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0),
    );
  }
  return statements;
}
