import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
console.log('Users:', JSON.stringify(users, null, 2));
// Also check who assignedTo refers to
const assignedId = 'cmpy63fbw0001vcjw8vr4s196';
const assignedUser = await prisma.user.findUnique({ where: { id: assignedId }, select: { name: true, email: true, role: true } });
console.log('AssignedTo user:', assignedUser);
await prisma.$disconnect();
