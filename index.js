/**
 * Nuora v0.4.1
 * Author: Nicholas Riley
 */
;(function () {
    "use strict";
    var path = require('path'),
        config,
        Nuora;
    try {
        config = require('./config/nuora.local');
    } catch (errConfigLoad) {
        config = require('./config/nuora');
    }
    config.opts = require('./lib/opts');
    config.env = (config.opts.production || process.env.NODE_ENV === 'production') ? 'production' : 'dev';
    config.apppath = __dirname;
    config.startpath = path.resolve(process.cwd());
    Nuora = require('./lib/nuora');
    module.exports = Nuora.initialize(config, require.main !== module);
}());

