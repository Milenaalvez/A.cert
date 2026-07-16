import bcryptjs from 'bcryptjs';
import { executeRaw, queryRaw } from '../lib/prisma.js';

async function main() {
  const email = 'milenayor581@gmail.com';
  const novaSenha = 'Acert@2026';
  const hash = bcryptjs.hashSync(novaSenha, 10);

  const user = await queryRaw("SELECT id, email FROM users WHERE email = $1", email);
  if (user.length === 0) {
    console.log(`Usuario ${email} nao encontrado. Criando...`);
    await executeRaw(
      `INSERT INTO users (id, name, email, password_hash, email_confirmed) VALUES (gen_random_uuid(), 'Milena', $1, $2, 1)`,
      email, hash
    );
    console.log('Usuario criado!');
  } else {
    await executeRaw("UPDATE users SET password_hash = $1, email_confirmed = 1 WHERE email = $2", hash, email);
    console.log('Senha atualizada!');
  }
  console.log(`Email: ${email}`);
  console.log(`Senha: ${novaSenha}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
