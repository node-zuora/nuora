var path = require('path');
module.exports = {
    username: process.env.ZUORA_USERNAME,
    password: process.env.ZUORA_PASSWORD,
    wsdl: path.join(__dirname, 'zuora.a.70.0.wsdl'),
    //this injects WSDL objects on initialization, sorted
    wsdlMixins: {
        RatePlanData: [
            'RatePlanCharge'
        ]
    }
};
