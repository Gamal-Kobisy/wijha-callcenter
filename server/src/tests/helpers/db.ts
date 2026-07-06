import { sql } from 'drizzle-orm';
import { test_db } from '../../db/pool.js';

const tables = [
  'project_call_detail_record',
  'owner_project',
  'call_detail_record',
  'user_log',
  'owner_info',
  'numbers',
  'user',
  'owner',
  'project',
];

export async function resetTestDatabase() {
  await test_db.execute(
    sql.raw(`TRUNCATE TABLE ${tables.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`)
  );
}
