const app = require('express')();
const session = require('express-session');
const FileStore = require('session-file-store')(session);

app
    .use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new FileStore(),
        cookie: {secure: false, httpOnly: true }
    }))
    .use(require('./logger'))
    .use('/api/auth', require('./oauth'));

module.exports = app;