import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { db } from './db/pool.js';

const app = express();
const port = 3000

db.execute('SELECT VERSION()').then((rows) => {
  console.log('Database version:', rows.fields);
}).catch((error) => {
  console.error('Error executing query:', error);
});

app.get('/api/v0', (req, res) => {
  res.send('Hello World!')
})

app.get(/.12/, (req: Request, res: Response) => {
  res.send('Hello World!')
});
app.use('/static', express.static(path.join(import.meta.dirname, 'public')));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

