import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dossier_observations (
        id TEXT PRIMARY KEY,
        dossier_id TEXT,
        user_id TEXT,
        user_name TEXT,
        text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('OK: tabela dossier_observations criada');
  } catch (e) {
    console.log('ERRO:', e.message);
  }
  await pool.end();
}

main();
