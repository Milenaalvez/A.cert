import { Client } from 'pg'

const client = new Client('postgresql://neondb_owner:npg_8VgWpj7ESkba@ep-floral-block-apn34kiz.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require')
await client.connect()
const res = await client.query('SELECT id, email, "verificationCode" FROM "User" WHERE email = $1', ['milena.demo.test@demo.com'])
console.log(JSON.stringify(res.rows, null, 2))
await client.end()
