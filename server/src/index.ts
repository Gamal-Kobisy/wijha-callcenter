import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';

const app = express();
const port = 3000

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

