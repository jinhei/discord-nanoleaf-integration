const startTimestamp = new Date();

module.exports = (req, res) => res.json({
  startTimestamp,
  version: require('../package.json').version,
});
