require('dotenv').config();
const express = require('express');

const app = express();

const SERVER_PORT = process.env.SERVER_PORT || 5000;

app
  .use(require('./middleware'))
  .use(require('./controllers'))
  .use(express.static('public', { extensions: ['html'] }))
  .listen(SERVER_PORT, () => {
    console.log(`Listening on ${SERVER_PORT}`);
    console.log(`Visit http://localhost:${SERVER_PORT}/ to log in`);
  });

module.exports = app;
