/** 
 * We login to Zuora at start because if there is an issue
 * with credentials we need to know before requests are made
 * @module start/zuora
 */
module.exports = function () {
    //this === handler
    var that = this;
    that.log.info('Start :: Zuora...');
    that.zuora.once('ready', function () {
        //TODO make life easy for now, we may decouple the handle
        that.soap = that.zuora.soap;
        that.zuora.login();
    });
    //start query
    if (that.opts.query || that.opts.interactive) {
        if (typeof that.opts.query === 'string') {
            that.zuora.once('loggedin', function () {
                that.log.info('querying> ', that.opts.query);
                that.zuora.query(that.opts.query, function (err, data) {
                    var query = this;
                    if (err) {
                        console.log(1);
                        that.log.warn(err, JSON.stringify(data));
                    } else {
                        console.log(query.result);
                        that.log.info(JSON.stringify(data));
                    }
                    process.exit();
                });
            });
        } else {
            that.instance.once('ready', function () {
                that.log.info('Opening ZOQL prompt...');
                var qp = that.zuora.queryPrompt(that.opts.interactive);
                qp.rl.on('close', function () {
                    process.stdout.write('\nBye\n'.cyan);
                    process.exit();
                });
            });
        }
    } /*else {
        that.zuora.once('loggedin', function () {
            //do stuff
        });
    }*/

    that.log.info('initializing...');
    that.zuora.initialize(that.config.zuora.wsdl);
};
//EOF lib/start/zuora.js
