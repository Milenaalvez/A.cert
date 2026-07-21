import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dossier_documents' ORDER BY ordinal_position");
console.log('Columns:', res.rows.map(r => r.column_name).join(', '));
await pool.end();
