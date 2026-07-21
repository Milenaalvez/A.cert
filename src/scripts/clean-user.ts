import { executeRaw, queryRaw } from '../lib/prisma.js';

async function main() {
  const user = await queryRaw("SELECT id, email FROM users WHERE email LIKE '%milenayor%'");
  if (user.length > 0) {
    console.log('Usuarios encontrados:', user.map(u => u.email));
    await executeRaw("DELETE FROM users WHERE email LIKE '%milenayor%'");
    console.log('Conta removida!');
  } else {
    console.log('Nenhum usuario milenayor encontrado');
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
