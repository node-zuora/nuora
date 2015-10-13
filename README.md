Nuora
=====
Zuora SOAP API on NodeJs

Install Nuora (Node + Zuora)
----------------------------
```bash
npm install nuora
```
**You may want to install Nuora globally for accessing the CLI**
```bash
sudo npm install -g nuora
```

Run Nuora using the CLI
-----------------------
```
$ ./node_modules/nuora -h

  Usage: nuora OPTION...

  --------------
  -- EXAMPLES --
  --------------

  Start the Zuora query prompt:

    $ nuora -q

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -p, --production           Launch instance in production environment
    -q, --query [value]  Start a Zuora query prompt (ZOQL REPL)
    -v, --verbose              Display logging in the terminal
    -i, --interactive          Start an interactive Zuora query prompt (ZOQL REPL) to use with node-inspector


```

Credentials
-----------
As of v1.2 Nuora expects all credentials to be in **.env** file in the project root and should expose the following variables:

```
ZUORA_USERNAME='john'
ZUORA_PASSWORD='pass'
```

***This means we no longer look for config.zuora.password or config.zuora.username***


Configuring
-----------

See Zuora's Knowledge Center:
[how to download the latest version of my Zuora WSDL](https://knowledgecenter.zuora.com/BC_Developers/SOAP_API/AB_Getting_started_with_the__SOAP_API/B_Zuora_WSDL#Download_the_Latest_Version_of_the_WSDL)

**Set the WSDL's path in the Nuora config object (see below)**... Nuora will automatically configure your endpoint based off the WSDL's "Zuora Service" field.

**Note:** Zuora's Sandbox API uses it's own WSDL and endpoint, be sure to download that from within the Zuora Sandbox interface, following the same methods as the link above.

```javascript
var Nuora = require('nuora');
var config = Nuora.config;

//set your credentials and wsdl file location
config.zuora.username = 'john';
config.zuora.password = 'secret';
config.zuora.wsdl = '/path-to-downloaded-zuora.wsdl'

var nuora = Nuora.build();
var zuora = nuora.zuora;
var sql = "select id, name from account limit 1";
zuora.once('loggedin', function () {
    console.log('Nuora is ready!');
    zuora.query(sql, function (err, data) {
        console.log(err, data);
    });
});

```

Examples
--------

###Create an account in Zuora

```
//following from above
var nuora = Nuora.build();
var zuora = nuora.zuora;
var soap = zuora.soap;
zuora.once('loggedin', function () {
    var accountParams = zuora.createObject('Account', {
            currency: 'USD',
            paymentTerm: 'Due Upon Receipt',
            status: 'Draft',
            batch: 'Batch1',
            //start the bill cycle today
            billCycleDay: new Date().getDate(),
            name: 'Nuora'
        });
    var body = soap.action('create', [accountParams]);
    soap.addBody(body);
    zuora.send(soap, function (err, data) {
        console.log(err, data);
    });
});
```

Adding Nuora to your package
----------------------------
In your dependencies
```
"nuora": "1.0.x"
```
**Nuora is under active development, because of the nature that this service provides, all minor patch updates will be graceful improvements on existing features to maintain backwards compatibility.**

Developing with custom configurations
-------------------------------------
**This is to make life easy when developing directly on and extending Nuora functionality**
To load custom configurations, you can copy and rename files in `nuora/config/` to `<filename>.local.js`. Then in your `nuora/config/nuora.local.js` you can specify the `*.local.js` file you want to load:
```bash
cp config/nuora.js config/nuora.local.js
```
You now have a local configuration you can edit without affecting the repo, but you will still be loading the remote configs unless you edit `config/nuora.local.js`. Let's say for example we wanted to load the `config/orm.local.js` file, we would make the following changes:
```js
/** @file config/nuora.local.js */
module.exports = {
-    zuora: require('./zuora'),
+    zuora: require('./zuora.local'),
    ...
```


Building Docs/Wiki
------------------
```bash
cd nuora && ./build
```

Debugging with Node-Inspector
-----------------------------
```bash
node-debug nuora
```

Interactive Query Mode
----------------------
```bash
#Start the query prompt
node nuora query
#If you want to interact with the data (requires node-inspector)
node-debug nuora iquery
```

Building your own Nuora Lib Modules
-----------------------------------

Nuora loads modules found in the `config/nuora.js` file. It looks for the `autoload` array property and uses modules defined in there to extend the Nuora Handler instance.
```javascript
/** @module config/nuora */
module.exports = {
    autoload: [
        //my lib module
        'fooLib'
    ]  
};
```

License
-------
This software is free to use under the MIT license. See the LICENSE file for license text and copyright information.
