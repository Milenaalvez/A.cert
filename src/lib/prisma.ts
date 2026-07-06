import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const adapter = new PrismaPg(pool);

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter } as any);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function queryRaw(text: string, ...params: any[]): Promise<any[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryRawOne(text: string, ...params: any[]): Promise<any> {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

export async function executeRaw(text: string, ...params: any[]): Promise<void> {
  await pool.query(text, params);
}

const settingsCache = new Map<string, string>();
let settingsCacheAt = 0;

export async function getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
  if (settingsCacheAt > Date.now() - 60000) {
    return settingsCache.get(key) ?? defaultValue;
  }
  try {
    const rows = await queryRaw('SELECT key, value FROM settings');
    settingsCache.clear();
    for (const r of rows) settingsCache.set(r.key, r.value);
    settingsCacheAt = Date.now();
  } catch {}
  return settingsCache.get(key) ?? defaultValue;
}

export default prisma;
