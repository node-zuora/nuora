/**
 * Author: Nicholas Riley
 * TODO Upgrade interface to a fully loaded REPL server
 * +query zuora directly
 * +mutate results
 * +history
 */
var readline = require('readline'),
    EventEmitter = require('events').EventEmitter,
    qp,
    history,
    QueryPrompt = function () {
        qp = this;
        qp.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        qp.read();
    };

QueryPrompt.start = function () {
    return new QueryPrompt();
};

QueryPrompt.prototype = new EventEmitter();

QueryPrompt.prototype.handler = function (sql) {
    qp.emit('read', sql);
};

QueryPrompt.prototype.read = function () {
    qp.rl.question('zoql> ', qp.handler);
};

module.exports = QueryPrompt;
