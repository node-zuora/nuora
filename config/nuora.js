/**
 * Load all configurations here
 */
var path = require('path');
module.exports = {
    configpath: __dirname,
    port: 8081,
    logfile: path.join(path.resolve(__dirname + '/..'), 'debug.log'),
    autoload: [
        'zuora'
    ],
    zuora: require('./zuora')
};
