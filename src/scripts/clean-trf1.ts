import 'dotenv/config';
import { executeRaw, queryRaw } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanTRF1() {
  console.log('[clean-trf1] Buscando certidoes TRF1...');

  const certs = await queryRaw(
    `SELECT id, name, document_path FROM certificates WHERE organ = 'TRF1'`
  );

  console.log(`[clean-trf1] Encontradas ${certs.length} certidoes TRF1`);

  for (const cert of certs) {
    // Remove arquivo PDF do disco
    if (cert.document_path) {
      const absPath = path.join(__dirname, '..', '..', cert.document_path);
      try {
        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
          console.log(`  [FILE] Removido: ${absPath}`);
        }
      } catch (e: any) {
        console.log(`  [FILE] Erro ao remover ${absPath}: ${e.message}`);
      }
    }

    // Remove do banco
    await executeRaw(`DELETE FROM certificates WHERE id = $1`, cert.id);
    console.log(`  [DB] Removido: ${cert.name} (${cert.id})`);
  }

  console.log('[clean-trf1] Concluido.');
  process.exit(0);
}

cleanTRF1().catch((err) => {
  console.error('[clean-trf1] ERRO:', err);
  process.exit(1);
});
