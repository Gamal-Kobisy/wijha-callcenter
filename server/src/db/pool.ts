// db/client.ts
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD!,
});
pool.on('error', (err) => {
  console.error('Unexpected error on DB client', err);
  process.exit(-1);
});

const testing_pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.TEST_DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD!,
});
testing_pool.on('error', (err) => {
  console.error('Unexpected error on TEST DB client', err);
  process.exit(-1);
});

export const db = drizzle(pool, {schema}) as NodePgDatabase<typeof schema>;

export const test_db = drizzle(testing_pool, {schema}) as NodePgDatabase<typeof schema>;

export async function closeDbPools() {
  await Promise.all([pool.end(), testing_pool.end()]);
}