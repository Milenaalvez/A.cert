import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const targetCompanyId = 'cmpyktdfl00012zfern0fxroz'; // Chronos LTDA
const result = await prisma.user.updateMany({
  where: { companyId: { not: targetCompanyId } },
  data: { companyId: targetCompanyId },
});
console.log(`Moved ${result.count} users to Chronos LTDA`);
await prisma.$disconnect();
