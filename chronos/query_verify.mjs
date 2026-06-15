import { Client } from 'pg'

const client = new Client('postgresql://neondb_owner:npg_8VgWpj7ESkba@ep-floral-block-apn34kiz.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require')
await client.connect()

// Find the user and get verification code
const res = await client.query('SELECT id, email, "verificationCode" FROM users WHERE email = $1', ['milena.demo.test@demo.com'])
console.log('USER:', JSON.stringify(res.rows, null, 2))

// Now verify the email directly
if (res.rows.length > 0) {
  const user = res.rows[0]
  console.log('VerificationCode:', user.verificationCode)
  
  // Update emailVerified directly
  await client.query('UPDATE users SET "emailVerified" = true, "verificationCode" = NULL, "verificationExpiresAt" = NULL WHERE id = $1', [user.id])
  console.log('Updated emailVerified to true')
  
  // Verify
  const check = await client.query('SELECT id, email, "emailVerified" FROM users WHERE id = $1', [user.id])
  console.log('AFTER:', JSON.stringify(check.rows, null, 2))
}

await client.end()
