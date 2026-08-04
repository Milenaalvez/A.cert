import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { env } from '../config/env.js'

let dbUrl = env.databaseUrl
if (!dbUrl.includes('sslmode=')) {
  const sep = dbUrl.includes('?') ? '&' : '?'
  dbUrl += `${sep}sslmode=verify-full`
}

const pool = new pg.Pool({ connectionString: dbUrl })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
