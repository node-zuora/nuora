var chai = require('chai');
Object.keys(chai).map(function (key) {
    global[key] = chai[key];
});
