module.exports = {
    password: '',
    username: '',
    endpoint: 'https://apisandbox.zuora.com/apps/services/a/66.0',
    wsdl: __dirname + '/zuora.a.66.0.wsdl',
    //this injects WSDL objects on initialization, sorted
    wsdlMixins: {
        RatePlanData: [
            'RatePlanCharge'
        ]
    }
};
