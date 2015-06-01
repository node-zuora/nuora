describe('Loading Nuora', function () {
    //using nuora as a module
    var colors = require('colors'),
        Nuora = require('../'),
        nuora,
        zuora,
        tests;
    it('has opts property', function () {
        expect(Nuora).to.have.property('opts');
    });
    Nuora.opts.option('--reporter [value]', '');
    Nuora.opts.option('-r [value]', '');
    it('builds Nuora', function () {
        nuora = Nuora.build();
        zuora = nuora.zuora;
        describe('Nuora build', function () {
            it('has zuora property', function () {
                expect(nuora).to.have.property('zuora');
            });
            it('has zuora.soap property', function () {
                expect(zuora).to.have.property('soap');
            });
        });
        tests = function () {
            describe('Perform a query', function () {
                this.timeout(10000);
                it('should return an array of no more than two elements', function (done) {
                    var sql = "select id from account limit 1",
                        i = 0,
                        callback = function (err, data) {
                            describe('Query ResultObject', function () {
                                it('should have property id', function () {
                                    assert(data.result.records.hasOwnProperty('Id'));
                                });
                            });
                            done(err);
                        };
                    zuora.query(sql, callback, true);
                });
            });
        };
    });

    describe('Logging in', function () {
        it('connected to the server', function (done) {
            zuora.on('loggedin', function () {
                done();
                tests();
            });
        });
    });
});
