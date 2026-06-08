import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const password = await bcrypt.hash("123456", 10);
const result = await prisma.user.updateMany({
  where: { email: { in: [
    "ana@chronos.test", "carlos@chronos.test", "beatriz@chronos.test",
    "diego@chronos.test", "fernanda@chronos.test", "gabriel@chronos.test",
    "helena@chronos.test", "igor@chronos.test"
  ]}},
  data: { password },
});
console.log(`Updated ${result.count} users with hashed password`);
await prisma.$disconnect();
