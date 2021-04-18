const app = require('express')();

app
    .use('/status', require('./status'))
    .use('/discord', require('./discord'));


module.exports = app;