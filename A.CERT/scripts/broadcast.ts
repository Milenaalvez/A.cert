import { broadcastToAll } from '../src/routes/notifications.js';

const [title, message, details, type] = process.argv.slice(2);

if (!title || !message) {
  console.log('Uso: npx tsx scripts/broadcast.ts "Titulo" "Mensagem curta" "Detalhes completos (opcional)" [tipo: info|success|warning|error]');
  process.exit(1);
}

broadcastToAll(title, message, type || 'info', undefined, details || undefined)
  .then(count => {
    console.log(`Pronto! ${count} usuarios notificados.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
