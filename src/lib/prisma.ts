import { PrismaClient } from '../generated/prisma/client.js';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma ?? new PrismaClient({} as any);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

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
