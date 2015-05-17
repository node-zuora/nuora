Nuora
=====
Node based Zuora API

```
$ node . -h

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


Configuring
-----------

**Download a copy of your Zuora WSDL and set it's path in your Nuora configuration**
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


To load custom configurations, you can copy and rename files in `nuora/config` to `<filename>.local.js`

**You must at least do this for `config/nuora.js`**
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

Install Modules
--------------------
```bash
npm install ./nuora
```

Start
-----
```bash
node nuora
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
