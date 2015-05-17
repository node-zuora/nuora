/**
 * Author: Nicholas Riley
 * @module lib/handler
 */
"use strict";
var that,
    Nuora,
    log,
    readline,
    readlineInterface,
    moduleMap = {},
    config,
    configpath,
    templateEngine,
    opts,
    path = require('path'),
    colors = require('colors'),
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
    configpath = config.configpath;
    that = this;
    that.opts = opts;
    that.config = config;
    that.apppath = config.apppath;
    that.startpath = config.startpath;
    that.configpath = configpath;
    that.log = log;
    that.http = http;
    that.loadModules(['zuora'], true);
    that.keys = Object.keys(that);
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

/** 
 * @property - holds a reference to all modules
 * loaded with the Nuora.loadModules method 
 */
Nuora.prototype.modules = {};

/**
 * @property - all loaded modules have their names
 * normalized, this gives us a reference modules
 * by their module path to find their normalized names
 */
Nuora.prototype.moduleMap = {};

/**
 * Loads modules into the handler using an array of paths.
 * The paths will be relative to the /lib directory.
 * @param {array} modules - an array of module paths
 * @param {boolean} initialize - Automatically initializes modules
 * by calling their 'init' method. Typically only used on startup.[default:false]
 * @returns {array} an array of added modules by their normalized name;
 * ie: ['Falcon.Contact', 'Falcon.AddGuest', ...]
 */
Nuora.prototype.loadModules = function (modules, initialize) {//{{{
    var i = 0,
        count,
        that = this,
        name = '',
        normName = '',
        module,
        moduleLength,
        //list of modules that have been added
        added = [],
        dirSlash = /^\.?\//;
    initialize = undefined === initialize ? false : initialize;
    if (!(modules instanceof Array)) {
        //just return first line of stack so we know what happened
        log.error(new TypeError('loadModules expects param 1 to be a valid array object')
                .stack
                .split('\n')
                .slice(0, 2)
                .join('\n')
                .trim());
        return;
    }
    moduleLength = modules.length;
    for (i; i < moduleLength; i++) {
        name = modules[i].replace(dirSlash, '');
        normName = that.normalizeName(name);
        //add to our module map so we can lookup the reference
        //via path instead of a normalized name
        that.moduleMap[name] = normName;
        log.info('Loading: ' + name + ' -> ' + normName);
        that.modules[normName] = require('./' + name);
        added.push(normName);
        //we bind any "initiliaze" objects directly to the handler
        if (initialize) {
            that[normName] = that.modules[normName];
            that[name] = that[normName].init(that);
        }
        if (undefined !== that.start[name]) {
            that.start[name].call(that);
        }
    }
    return added;
};//}}}

/**
 * Returns an already loaded module
 * @param {string} name - the module's filepath relative to the lib directory
 * @returns {object|undefined}
 * @example
 * handler.getModule('falcon/add-guest');//returns handler.modules.Falcon.AddGuest
 */
Nuora.prototype.getModule = function (name) {
    var that = this;
    //trim ./ or /
    name = name.replace(/^\.?\//, '');
    return that.modules[that.moduleMap[name]];
};

/**
 * This converts our modules into a normalized PascalCase name.
 * If the modules are sub-modules (ie: Falcon sub-modules) 
 * they will be accessible as Module.SubModule; 
 * eg: falcon/add-guest.js sub-module will be accessible as
 * Falcon.AddGuest and this is available throughout the entire
 * scope, eg: Nuora.modules.Falcon.AddGuest
 * @param {string} name - The module name to be normalized
 * @param {boolean} camelCase - true, to use camelCase instead of PascalCase [default: false]
 */
Nuora.prototype.normalizeName = function (name, camelCase) {//{{{
    var count = 0,
        normName = '';
    camelCase = undefined === camelCase ? false : camelCase;
    name = name
        .replace(/^\.?\//, '')
        .replace('/', '/_')
        .split(/[_\-]/g);
    for (count; count < name.length; count++) {
        if (camelCase && count === 0) {
            normName += name[count].charAt(0).toLowerCase() + name[count].slice(1);
        } else {
            normName += name[count].charAt(0).toUpperCase() + name[count].slice(1);
        }
    }
    return normName.replace('/', '.');
};//}}}

/**
 * Checks if a module has been loaded; checked
 * by filepath relative to lib directory
 * @param {string} name - the normalize name of the module;
 * this can also be the file path if second parameter is true
 * @param {boolean} checkFilepath - default behavior is to check
 * using a normalized name; setting this to true will check for a 
 * filepath instead; the filepath is relative to the lib directory
 * @returns {boolean}
 * @example
 * //default
 * handler.moduleLoaded('Falcon.AddGuest');//returns true|false
 * //checkFilepath=true
 * handler.moduleLoaded('falcon/add-guest', true);//returns true|false
 */
Nuora.prototype.moduleLoaded = function (name, checkFilepath) {//{{{
    var that = this;
    checkFilepath = undefined === checkFilepath ? false : checkFilepath;
    if (checkFilepath) {
        name = that.normalizeName(name);
    }
    return undefined !== that.modules[name];
};//}}}

/**
 * add custom start scripts to the handler instance
 * @extends module:start
 */
Nuora.prototype.start = require('./start');

module.exports = Nuora;
//EOF handler.js
