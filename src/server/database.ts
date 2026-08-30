import { Pool } from "pg";

let pool: Pool | undefined;

export function hasPostgresRuntime(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabasePool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the PostgreSQL runtime.");
  if (!pool) pool = new Pool({ connectionString, max: 10 });
  return pool;
}

export async function checkDatabaseConnection(): Promise<void> {
  await getDatabasePool().query("SELECT 1");
}

export async function closeDatabaseForTests(): Promise<void> {
  if (pool) await pool.end();
  pool = undefined;
}
