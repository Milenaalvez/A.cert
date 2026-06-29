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

export default prisma;
