/**
 * Author: Nicholas Riley
 * @module lib/handler
 */
"use strict";
var nuora,
    Nuora,
    log,
    config,
    configpath,
    opts,
    Zuora = require('./zuora'),
    zuora,
    logger = require('winston'),
    http = require('http'),
    transports = [];

/** @constructor */
Nuora = function () {//{{{
    opts.parse(process.argv);
    if (undefined !== config.logfile && config.logfile.length) {
        transports.push(new (logger.transports.File)({filename: config.logfile}));
    }
    if (opts.verbose) {
        transports.push(new (logger.transports.Console)({colorize: true}));
    }
    log = new (logger.Logger)({transports: transports});
    log.info('Constructing Nuora instance...');
    configpath = config.configpath;
    nuora = this;
    nuora.log = log;
    nuora.opts = opts;
    nuora.config = config;
    nuora.apppath = config.apppath;
    nuora.startpath = config.startpath;
    nuora.configpath = configpath;
    nuora.log = log;
    nuora.http = http;
    nuora.keys = Object.keys(nuora);
    nuora.connect();
};//}}}

Nuora.config = Error("Run initialize to set config");

/**
 * Builds and returns Nuora
 */
Nuora.build = function () {
    return new Nuora();
};

/**
 * Initializes the handler
 * @function Nuora.initialize
 * @param {object} bind - objects to be bound to handler
 */
Nuora.initialize = function (initConfig, required) {//{{{
    config = initConfig;
    opts = config.opts;
    Nuora.opts = opts;
    Nuora.config = config;
    if (required) {
        return Nuora;
    } else {
        return Nuora.build();
    }
};//}}}

Nuora.prototype.connect = function () {
    zuora = nuora.zuora = Zuora.build(nuora);
    zuora.once('ready', function () {
        //TODO make life easy for now, we may decouple the handle
        nuora.soap = zuora.soap;
        zuora.login();
    });
    //start query
    if (nuora.opts.query || nuora.opts.interactive) {
        if (typeof nuora.opts.query === 'string') {
            zuora.once('loggedin', function () {
                log.info('querying> ', nuora.opts.query);
                zuora.query(nuora.opts.query, function (err, data) {
                    var query = this;
                    if (err) {
                        console.log(1);
                        log.warn(err, JSON.stringify(data));
                    } else {
                        console.log(query.result);
                        log.info(JSON.stringify(data));
                    }
                    process.exit();
                });
            });
        } else {
            zuora.once('loggedin', function () {
                log.info('Opening ZOQL prompt...');
                var qp = nuora.zuora.queryPrompt(nuora.opts.interactive);
                qp.rl.on('close', function () {
                    process.stdout.write('\nBye\n'.cyan);
                    process.exit();
                });
            });
        }
    } /*else {
        nuora.zuora.once('loggedin', function () {
            //do stuff
        });
    }*/

    log.info('initializing...');
    zuora.initialize(nuora.config.zuora.wsdl);
};

module.exports = Nuora;
//EOF handler.js
