import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Drop and recreate with correct column types
await pool.query(`DROP TABLE IF EXISTS dossier_documents CASCADE`);
await pool.query(`
  CREATE TABLE dossier_documents (
    id TEXT PRIMARY KEY,
    dossier_id TEXT NOT NULL,
    person_id TEXT,
    name VARCHAR NOT NULL,
    label VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_type VARCHAR,
    file_size INTEGER,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_dossier_docs_dossier ON dossier_documents(dossier_id);
  CREATE INDEX IF NOT EXISTS idx_dossier_docs_person ON dossier_documents(person_id);
`);
console.log('Tabela dossier_documents recriada com TEXT');
await pool.end();
