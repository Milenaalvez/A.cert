import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('[Migrate] Criando dossier_observations...');

await pool.query(`
  CREATE TABLE IF NOT EXISTS dossier_observations (
    id TEXT PRIMARY KEY,
    dossier_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )
`);
console.log('  table: OK');

await pool.query(`CREATE INDEX IF NOT EXISTS idx_doss_obs_dossier ON dossier_observations(dossier_id)`);
console.log('  index: OK');

console.log('[Migrate] Concluído!');
await pool.end();
