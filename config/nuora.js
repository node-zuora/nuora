/**
 * Load all configurations here
 */
var path = require('path');
module.exports = {
    configpath: __dirname,
    logfile: path.join(path.resolve(__dirname + '/..'), 'debug.log'),
    zuora: require('./zuora')
};
