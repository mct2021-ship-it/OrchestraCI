
import Database from 'better-sqlite3';
try {
  const db = new Database('app.db');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  const count = db.prepare("SELECT count(*) as count FROM app_state").get();
  console.log('App State Count:', count);
  console.log('Database check: SUCCESS');
} catch (e) {
  console.error('Database check: FAILED', e);
  process.exit(1);
}
