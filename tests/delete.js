//using nuora as a module
var colors = require('colors'),
    nuora = require('../../nuora');
nuora.zuora.on('loggedin', function () {
    console.log('Zuora is ready!');
    nuora.zuora.delete(
        'Account', 
        ['2c92c0f84c74f855014c75fa24663b12',
         '2c92c0f94c750681014c75f11c1c6253'],
        function (err, data) {
            console.log(err, data);
        }
    );
});
