import nodemailer from 'nodemailer'
import 'dotenv/config'

const host = process.env['SMTP_HOST'] || 'smtp.gmail.com'
const port = Number(process.env['SMTP_PORT']) || 587
const user = process.env['SMTP_USER'] || ''
const pass = process.env['SMTP_PASS'] || ''
const from = process.env['SMTP_FROM'] || 'noreply@chronos.app'

console.log('=== Diagnóstico de Email ===')
console.log(`SMTP_HOST: ${host}`)
console.log(`SMTP_PORT: ${port}`)
console.log(`SMTP_USER: ${user}`)
console.log(`SMTP_PASS: ${pass ? '****' : 'AUSENTE'}`)
console.log(`SMTP_FROM: ${from}`)
console.log()

async function testSmtp(transportCfg, label) {
  const transport = nodemailer.createTransport(transportCfg)
  try {
    await transport.verify()
    console.log(`✓ ${label}: CONEXÃO OK (verify() sucedeu)`)
    return true
  } catch (err) {
    console.log(`✗ ${label}: FALHA - ${err.message?.split('\n')[0] || err}`)
    return false
  } finally {
    transport.close()
  }
}

async function main() {
  // Test 1: Port 587 (STARTTLS) with requireTLS
  const cfg587 = {
    host, port: 587, secure: false,
    auth: { user, pass },
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  }
  const port587Ok = await testSmtp(cfg587, 'Porta 587 (STARTTLS)')

  // Test 2: Port 465 (SSL) 
  const cfg465 = {
    host, port: 465, secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  }
  const port465Ok = await testSmtp(cfg465, 'Porta 465 (SSL)')

  // Test 3: Port 587 without requireTLS (current config)
  const cfg587NoTLS = {
    host, port: 587, secure: false,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  }
  const port587NoTLSOk = await testSmtp(cfg587NoTLS, 'Porta 587 (sem requireTLS)')

  // Test 4: Try sending a test email
  if (port587Ok || port465Ok) {
    const cfg = port587Ok ? cfg587 : cfg465
    const transport = nodemailer.createTransport(cfg)
    try {
      const info = await transport.sendMail({
        from,
        to: user, // send to self as test
        subject: 'Teste de diagnóstico Chronos',
        text: 'Este é um email de teste. Se você recebeu, o SMTP está funcionando.',
      })
      console.log(`\n✓ Email de teste ENVIADO para ${user}: ${info.messageId}`)
    } catch (err) {
      console.log(`\n✗ Email de teste FALHOU: ${err.message?.split('\n')[0] || err}`)
    } finally {
      transport.close()
    }
  }

  console.log('\n=== Fim do diagnóstico ===')
}

main().catch(console.error)
