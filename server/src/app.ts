import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(express.json());
app.use('/api/v1', apiRouter);
app.use('/static', express.static(path.join(currentDir, 'public')));