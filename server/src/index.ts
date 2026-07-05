import 'dotenv/config';
import { app } from './app.js';
import { db } from './db/pool.js';
import { sql } from 'drizzle-orm';
import { exit } from 'process';

console.log('DB configuration inside index.ts: '
    ,{
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: "hehe stay safe",
    }
  )

db.execute(sql`SELECT version();`).then(result => {
  if(result.rows[0]?.version){
    console.log("\x1b[32mConnected to PostgreSQL database.\x1b[0m");
  };
}).catch(error => {
  console.error('\x1b[31mDB Error executing query:', error, "\x1b[0m");
  exit(1);
});

const port = process.env.PORT || 3000;


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

