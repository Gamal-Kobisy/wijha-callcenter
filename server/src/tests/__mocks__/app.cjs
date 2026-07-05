const express = require('express');
const { apiRouter } = require('../../routes/index');

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

module.exports = { app };
