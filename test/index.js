var assert = require('assert'),
    Nuora = require('../'),
	nuora,
	zuora,
	queryData;

//overrides hacks for command mod
Nuora.opts.option('--reporter [value]', '');
Nuora.opts.option('-r [value]', '');
Nuora.opts.option('-b,--bail [value]', '');

describe('Loading Nuora', function () {
    //using nuora as a module
    it('has opts property', function () {
        assert(Nuora.opts);
    });

	describe('Nuora build', function () {
		it('builds successfully', function (done) {
			nuora = Nuora.build();
			nuora.zuora.once('ready', done);
		});
		it('has zuora property', function () {
			assert(nuora.zuora);
			zuora = nuora.zuora;
		});
		it('has zuora.soap property', function () {
			assert(zuora.soap);
		});
	});

    describe('Logging in', function () {
        it('connected to the server', function (done) {
			this.timeout(3000);
            zuora.on('loggedin', function () {
				done();
            });
        });
    });

	describe('Perform a query', function () {
		this.timeout(10000);
		it('should return an array of no more than one element', function (done) {
			var sql = "select id from account limit 1",
				callback = function (err, data) {
					queryData = data;
					done(err);
				};
			zuora.query(sql, callback, true);
		});
	});
	
	describe('Query ResultObject', function () {
		it('should have property id', function () {
			assert(queryData.result.records.Id);
		});
	});
});
