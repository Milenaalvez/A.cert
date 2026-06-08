import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
// Get company info for users
const users = await prisma.user.findMany({ select: { name: true, email: true, role: true, companyId: true } });
console.log('Users:', JSON.stringify(users, null, 2));
// Get first ticket's company
const ticket = await prisma.ticket.findFirst({ select: { companyId: true, title: true } });
console.log('First ticket companyId:', ticket?.companyId, '| title:', ticket?.title);
// Get companies
const companies = await prisma.company.findMany();
console.log('Companies:', JSON.stringify(companies, null, 2));
await prisma.$disconnect();
