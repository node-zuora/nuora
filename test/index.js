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
	this.timeout(6000);
    //using nuora as a module
	before(function (done) {
        assert(Nuora.opts, 'missing opts property');
		nuora = Nuora.build();
		zuora = nuora.zuora;
		zuora.on('loggedin', function () {
			assert(zuora.soap, 'missing zuora property');
			done();
		});
    });

	describe('Perform a query', function () {
		it('should return an array of no more than one element', function (done) {
			var sql = "select id from account limit 1",
				callback = function (err, data) {
					console.log(data);
					queryData = data;
					done(err);
				};
			zuora.query(sql, callback, true);
		});
		describe('Query ResultObject', function () {
			it('should have property id', function () {
				assert(queryData.result.records.Id);
			});
		});
	});
	


    var account = {},
        contact = {};

    describe.only('Create an account', function () {
        it('creates draft account and returns success: true', function (done) {
            var accountObject = {
                    name: 'Nicholas Riley' + Date.now(),
                    batch: 'Batch1',
                    billCycleDay: 1,
                    currency: 'USD',
                    paymentTerm: 'Due Upon Receipt',
                    status: 'Draft'
                },
                body,
                soap = zuora.soap.create();
            accountObject = zuora.createObject('Account', accountObject);
            body = soap.action('create', [accountObject]);
            soap.addBody(body);
            zuora.send(soap, function (err, data) {
                account = data.result;
                done(err);
            });
        });
        describe('Data ResultObject', function () {
            it('has key success with value true', function () {
                assert.equal(account.success, true);
            });
            it('has Id property', function () {
             	assert(account.Id);
            });
        });
    });

    describe('Create contact', function () {
        this.timeout(10000);
        it('should return a contact with property "Id"', function (done) {
            var contactObject = zuora.createObject('Contact', {
                    accountId: account.Id,
                    firstName: 'Mars',
                    lastName: 'Rover',
                    mobilePhone: '888-555-5555',
                    city: 'LA'
                });
            soap = zuora.soap.create();
            body = soap.action('create', [contactObject]);
            soap.addBody(body);
            zuora.send(soap, function (err, data) {
                contact = data.result;
                done(err);
            });
        });
        describe('Contact.create response', function () {
            it('has Id property', function () {
                expect(contact).to.have.property('Id');
            });
            it('has success property equal to true', function () {
                expect(contact).to.have.property('success').equal(true);
            });
        });
    });

    describe('Update account', function () {
        this.timeout(10000);
        var result;
        it('returns success: true', function (done) {
            soap = zuora.soap.create();
            accountObject = zuora.createObject('Account', {
                Id: account.Id,
                BillToId: contact.Id,
                SoldToId: contact.Id,
                Status: 'Active'
            });
            body = soap.action('update', [accountObject]);
            soap.addBody(body);
            zuora.send(soap, function (err, data) {
                result = data.result;
                done(err);
            });
        });
        describe('Account Update Response', function () {
            it('has Id property', function () {
                expect(result).to.have.property('Id');
            });
            it('has success property equal to true', function () {
                expect(result).to.have.property('success').equal(true);
            });
        });
    });

    describe('Create a subscription', function () {
        this.timeout(10000);
        it('should return subscription id', function (done) {
            var ztime = zuora.time(),
                body,
                soap = zuora.soap.create(),
                //create a new SubscribeRequest Object
                //the following is a bare-minimum example of what's required
                subscribe = zuora.createObject('SubscribeRequest', {
                    Account: {
                        Id: account.Id
                    },
                    SoldToContact: {
                        Id: contact.Id
                    },
                    BillToContact: {
                        Id: contact.Id
                    },
                    SubscriptionData: {
                        Subscription: {
                            autoRenew: true,
                            name: null,
                            contractAcceptanceDate: ztime,
                            contractEffectiveDate: ztime,
                            //invoiceOwnerId:
                            termType: 'EVERGREEN'
                        },
                        RatePlanData: {
                            RatePlan: {
                                productRatePlanId: '2c92c0f8495b4c880149628653f7173d'
                            },
                            RatePlanCharge: {
                                productRatePlanChargeId: '2c92c0f9495b55010149627fa0eb2d90'
                            }
                        }
                    }
                });
            //create child "subscribes"
            subscribe = zuora.subscriptionObject(subscribe);
            body = soap.subscribe([subscribe]);
            soap.addBody(body);
            zuora.send(soap, function (err, data) {
                result = data.result;
                done(err);
            });
        });
        describe('Subscription Creation Response', function () {
            it('has SubscriptionId property', function () {
                expect(result).to.have.property('SubscriptionId');
            });
            it('has SubscriptionNumber property', function () {
                expect(result).to.have.property('SubscriptionNumber');
            });
            it('has success property equal to true', function () {
                expect(result).to.have.property('success').equal(true);
            });
        });
    });

    describe('Deleting accounts', function () {
        var accounts;
        var deleteResponse;
        this.timeout(10000);
        it('properly queries created account', function (done) {
            var sql = "select id from account where name like 'Mars Rover%'";
            zuora.query(sql, function (err, data) {
                accounts = data.result.records;
                done(err);
            });
        });

        it('properly sorts through an array of account objects', function () {
            if (!(accounts instanceof Array)) {
                accounts = [accounts.Id];
            } else {
                accounts = accounts.map(function (account) {
                    return account.Id;
                });
            }
        });

        it('deletes an array of accounts', function (done) {
            zuora.delete(
                'Account',
                accounts,
                function (err, data) {
                    deleteResponse = data;
                    done(err);
                }
            );
        });

        describe('Delete Response', function () {
            it('should be an object', function () {
                assert.typeOf(deleteResponse, 'object');
            });
            it('should have a result array or object', function () {
                assert.property(deleteResponse, 'result');
                if (!(deleteResponse.result instanceof Array)) {
                    assert.typeOf(deleteResponse.result, 'object');
                    deleteResponse.result = [deleteResponse.result];
                }
            });
            describe('DeleteResponse.Result', function () {
                it('should have property "success" equal to true', function () {
                    deleteResponse.result.map(function (res) {
                        expect(res).to.have.property('success').equal(true);
                    });
                });
                it('should have property "id" with length of 32', function () {
                    deleteResponse.result.map(function (res) {
                        expect(res).to.have.property('id').with.length(32);
                    });
                });
            });

        });
    });
});
