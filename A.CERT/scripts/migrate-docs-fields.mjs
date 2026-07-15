import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('[Migrate] Adicionando colunas à dossier_documents...');

try {
  await pool.query(`ALTER TABLE dossier_documents ADD COLUMN IF NOT EXISTS description TEXT`);
  console.log('  description: OK');
} catch (e) { console.log('  description: skip -', e.message); }

try {
  await pool.query(`ALTER TABLE dossier_documents ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`);
  console.log('  sort_order: OK');
} catch (e) { console.log('  sort_order: skip -', e.message); }

try {
  await pool.query(`ALTER TABLE dossier_documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT`);
  console.log('  uploaded_by: OK');
} catch (e) { console.log('  uploaded_by: skip -', e.message); }

console.log('[Migrate] Concluído!');
await pool.end();
