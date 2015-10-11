/**
 * Parses CLI parameters
 * Author: Nicholas Riley
 * @module lib/opts
 */
"use strict";
var opts = require('commander');
opts
.version('Nuora v1.0.0')
.usage('OPTION...')
.description('--------------\n  -- EXAMPLES --\n  --------------\n' + 
		'\n  Start the Zuora query prompt:\n\n\t$ nuora -q\n')
.option('-p, --production', 'Launch instance in production environment')
.option('-q, --query [customQuery]', 'Start a Zuora query prompt (ZOQL REPL)')
.option('-v, --verbose', 'Display logging in the terminal')
.option('-i, --interactive', 'Start an interactive Zuora query prompt (ZOQL REPL) to use with node-inspector');

module.exports = opts;
//EOF lib/opts.js
