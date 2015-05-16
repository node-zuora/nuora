//using nuora as a module
var colors = require('colors'),
    Nuora = require('../../nuora'),
    nuora = Nuora.create(),
    zuora = nuora.zuora;
nuora.zuora.on('loggedin', function () {
    console.log('Zuora is ready!');
    var sql = "select Id from Account where name = 'Nicholas Riley' limit 2",
        i = 0,
        callback = function (err, data) {
            var query = this;
            console.log('callback triggered!'.yellow);
            if (err) {
                console.log(err);
            } else {
                console.log(data);
                if (!data.result.done) {
                    query.more();
                } else {
                    console.log(query.result);
                }
            }
        };
    zuora.query(sql, callback, true);
});
