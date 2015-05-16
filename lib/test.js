/**
 * Author: Nicholas Riley
 */
"use strict";
var that,
    nuora,
    zuora,
    test,
    Cue = {},
    colors = require('colors'),
    Test = function (instance) {
        test = this;
        nuora = instance;
        zuora = nuora.zuora;
        test.handler = instance;
        test.store = {};
        test.start();
    };


Test.build = function (instance) {
    return new Test(instance);
};


Test.prototype.register = function (fnName, msg, enabled) {
    console.log('registering test ' + fnName.green);
    if (Cue.hasOwnProperty(fnName)) {
        this.store[fnName] = {
            enabled: enabled,
            fn: Cue[fnName],
            msg: msg
        };
    }
    if (enabled) {
        console.log('----------');
        console.log(('running test: ' + fnName).green);
        Cue[fnName]();
    } else {
        console.log('----------');
        console.log(('test disabled: ' + fnName).yellow);
    }
};

Test.prototype.start = function () {
    this.register('updateMember', 'Updates a member Account or Contact object', false);
    this.register('query', 'Performs a query', false);
    this.register('createAccount', 'Creates an account', false);
    this.register('createContact', 'Creates an account contact', false);
    this.register('export', 'Exports a query', true);
};

Cue.export = function () {
    var sql = "select Id from Account",
        i = 0,
        callback = function (err, data) {
            console.log('callback triggered!'.yellow);
            if (err) {
                console.log(err);
            } else {
                console.log(data);
                for (i; i < data.result.records.length; i++) {
                    console.log(data.result.records[i]);
                }
            }
        };
    zuora.query(sql, callback, true);
};

Cue.updateMember = function () {
    var params = {
            'FirstName': 'Williams'
        };
    zuora.update('Contact', 'M-4011830', params, function (err, data) {
        console.log(err, data);
    });
};

Cue.createContact = function (account) {
    console.log(('creating contact: ' + account.AccountId).green);
    var contactObject = {
            accountId: account.AccountId,
            address1: 'Mars',
            country: 'USA',
            firstName: 'Nick',
            lastName: 'Riley'
        },  
        body,
        soap = nuora.soap.create();
    contactObject = zuora.createObject('Contact', contactObject);
    body = soap.action('create', [contactObject]);
    console.log('---------------'.red);
    console.log(body);
    console.log('---------------'.red);
    soap.addBody(body);
    console.log(soap);
    console.log('---------------'.red);
    zuora.send(soap, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log('success', data);
            var id = data.result.Id;
            account.ContactId = id;
            //TODO
        }
    });
};

Cue.createAccount = function () {//{{{
    var accountObject = {
            name: 'Nick Foo' + Date.now(),
            billCycleDay: 1,
            currency: 'USD',
            paymentTerm: 'Due Upon Receipt',
            status: 'Draft'
        },
        body,
        soap = zuora.soap.create();
    accountObject = zuora.createObject('Account', accountObject);
        //TODO fix this @soap.js:256
    body = soap.action('create', [accountObject]);
    soap.addBody(body);
    zuora.send(soap, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            var id = data.result.Id;
            Cue.createContact({
                AccountId: id
            });
        }
    });
};//}}}


Cue.createPaymentMethod = function () {
    var paymentMethodObject = {
            name: ''
        };
};

Cue.query = function () {
    var sql = "select Id from Account",
        callback = function (err, data) {
            console.log('callback triggered!'.yellow);
            if (err) {
                console.log(err);
            } else {
                console.log(data);
                var i = 0;
                for (i; i < data.result.records.length; i++) {
                    console.log(data.result.records[i]);
                }
            }
        };
    zuora.query(sql, callback);
};

module.exports = Test;
