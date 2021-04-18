const _ = require('lodash');

module.exports = (req, res, next) => {
    console.log(_.pick(req, ['method', 'path', 'body', 'url', 'query', 'hash']));
    next();
}