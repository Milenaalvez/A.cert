import 'dotenv/config';
import { executeRaw, queryRaw } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

async function fixPaths() {
  console.log('========================================');
  console.log('  Fix document_path nas certificates');
  console.log(`  Project root: ${PROJECT_ROOT}`);
  console.log('========================================');

  const certs = await queryRaw(
    `SELECT id, organ, name, document_path, dossier_id FROM certificates WHERE document_path IS NOT NULL AND document_path != ''`
  );
  console.log(`Total certificados com document_path: ${certs.length}`);

  let fixed = 0;
  let missing = 0;
  let alreadyAbs = 0;

  for (const cert of certs) {
    const oldPath = cert.document_path;

    // Ja é absoluto? Nao precisa mexer
    if (path.isAbsolute(oldPath)) {
      if (fs.existsSync(oldPath)) {
        alreadyAbs++;
      } else {
        console.log(`  [MISSING] ${oldPath}`);
        missing++;
      }
      continue;
    }

    // Caminho relativo — tenta resolver
    const attempts = [
      { label: 'direto', p: path.join(PROJECT_ROOT, oldPath) },
      { label: 'com data/', p: path.join(PROJECT_ROOT, 'data', oldPath) },
    ];

    let found = false;
    for (const attempt of attempts) {
      if (fs.existsSync(attempt.p)) {
        const absPath = attempt.p;
        await executeRaw(
          'UPDATE certificates SET document_path = $1 WHERE id = $2',
          absPath, cert.id
        );
        console.log(`  [FIX] ${cert.organ} ${cert.name?.slice(0, 30)}`);
        console.log(`        ${oldPath}`);
        console.log(`        → ${absPath}`);
        fixed++;
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`  [NOT FOUND] ${cert.organ} ${cert.name?.slice(0, 30)}`);
      console.log(`        ${oldPath}`);
      console.log(`        tried: ${attempts.map(a => a.p).join(', ')}`);
      missing++;
    }
  }

  console.log('========================================');
  console.log(`  Ja absolutos: ${alreadyAbs}`);
  console.log(`  Corrigidos:   ${fixed}`);
  console.log(`  Nao achados:  ${missing}`);
  console.log('========================================');
  process.exit(0);
}

fixPaths().catch(err => {
  console.error('ERRO:', err);
  process.exit(1);
});
