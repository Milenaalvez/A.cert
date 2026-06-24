import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'data', 'acert.db'));
try {
  db.exec("ALTER TABLE properties ADD COLUMN updated_at TEXT DEFAULT ''");
  console.log('Column updated_at added successfully');
} catch (e) {
  console.log('Column may already exist:', e.message);
}
const info = db.pragma('table_info(properties)');
info.forEach(c => console.log(c.name, c.type));
db.close();
