//using nuora as a module
var colors = require('colors'),
    nuora = require('../../nuora');
nuora.zuora.on('loggedin', function () {
    console.log('Zuora is ready!');
    var ztime = nuora.zuora.time(),
        body,
        soap = nuora.soap.create(),
        //create a new SubscribeRequest Object
        //the following is a bare-minimum example of what's required
        subscribe = nuora.zuora.createObject('SubscribeRequest', {
            Account: {
                //John Smith
                Id: '2c92c0f44a349633014a3f76cb606839'
                /*billCycleDay: 1,
                currency: 'USD',
                paymentTerm: 'Due Upon Receipt',
                status: 'Draft',
                batch: 'Batch1',
                billCycleDay: new Date().getDate()*/
            },
            BillToContact: {
                //John Smith
                Id: '2c92c0f44a349633014a3f87bcb2467b'
            },
            SubscriptionData: {
                Subscription: {
                    autoRenew: true,
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
    subscribe = nuora.zuora.subscriptionObject(subscribe);
    body = soap.subscribe([subscribe]);
    soap.addBody(body);
    nuora.zuora.send(soap, function (err, data) {
        console.log('-----sent------'.magenta);
        console.log(err, data);
    });
});

