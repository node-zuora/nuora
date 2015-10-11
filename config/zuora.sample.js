var path = require('path');
module.exports = {
    password: '',
    username: '',
    wsdl: path.join(__dirname, 'zuora.a.70.0.wsdl'),
    //this injects WSDL objects on initialization, sorted
    wsdlMixins: {
        RatePlanData: [
            'RatePlanCharge'
        ]
    }
};
