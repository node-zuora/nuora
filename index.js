/**
 * Nuora v1.2.0
 * Author: Nicholas Riley
 */
require('colors');
require('dotenv').load();
;(function () {
    "use strict";
    var path = require('path'),
		config = require('./config/nuora'),
		Nuora = require('./lib/nuora');

    config.opts = require('./lib/opts');
    config.env = (config.opts.production || process.env.NODE_ENV === 'production') ? 'production' : 'dev';
    config.apppath = __dirname;
    config.startpath = path.resolve(process.cwd());
    module.exports = Nuora.initialize(config, require.main !== module);
}());
