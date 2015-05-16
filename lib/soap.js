/**
 * Author: Nicholas Riley
 * @desciption SOAP API Bridge
 * This module will
 */
"use strict";
var zuora,//{{{
    log,
    handler,
    buildXml = require('data2xml')(),
    /**
     * create a SOAP object wrapper
     * @constructor Soap
     * @example
     * var xml2 = Soap.create(),
     *     body2 = xml2.action('create', {
     *         'PaymentMethod': {
     *             'OutOfOrder': 'Something out of order',
     *             'AccountId': 'Something special'
     *         }
     *     });
     * 
     * xml2.addBody(body2);
     * console.log(xml2.render());
     * return;
     */
    Soap = function () {
        var ns = zuora.definitions,
            that = this;
        that.body = {};
        that.header = {};
        that._attr = {
            'xmlns:SOAP-ENV': 'http://schemas.xmlsoap.org/soap/envelope/',
            //ns2 if belongs to a zObject
            'xmlns:ns2': ns['xmlns:ons'],
            'xmlns:xsi': ns['xmlns:xs'] + '-instance',
            //ns1 if belongs to global Zuora API
            'xmlns:ns1': ns['xmlns:zns']
        };
    };//}}}

/** 
 * Create and return a new Soap object to build on
 * @function Soap#create
 */
Soap.create = function () {
    return new Soap();
};

/**
 * Initializes the Soap objects option property {@link Soap#options}
 * @function Soap.initialize
 * @param {object} zuoraInstance - Zuora instance object
 */
Soap.initialize = function (zuoraInstance) {//{{{
    zuora = zuoraInstance;
    handler = zuora.handler;
    log = handler.log;
    var match = zuora.config.endpoint.match(/http[s]?:\/\/([\w\.]+)+([\/].+)+/);
    if (match.length !== 3) {
        throw new Error('Could not parse config endpoint into (host, path)');
    }
    Soap.prototype.options.host = Soap.prototype.options.hostname = match[1];
    Soap.prototype.options.path = Soap.prototype.options.pathname = match[2];
};//}}}

/**
 * @member {object} Soap#options
 * @property {string} options.host - the hostname or ip to send SOAP requests to
 * @property {string} options.hostname - same as host
 * @property {number} options.port - the port for the SOAP service 443 if https 80 if http
 * @property {string} options.path - the endpoint path
 * @property {string} options.pathname - same as path
 * @property {string} options.method - the method to use for sending data [POST]
 * @property {string} options.connection - the connection type [close]
 * @property {object} options.headers - the request headers
 */
Soap.prototype.options = {//{{{
    host: '',
    port: 443,
    path: '',
    method: 'POST',
    connection: 'close',
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'none',
        'Accept-Charset': 'utf-8',
        'Content-Type': 'text/xml'
    }
};
Soap.prototype.options.hostname = Soap.prototype.options.headers.Host = Soap.prototype.options.host;
Soap.prototype.options.pathname = Soap.prototype.options.path;//}}}

/**
 * Adds xml content to the Soap object's body
 * @param {object} bodyObject - Finalized body data as object
 * @TODO - this will overwrite all content in body, consider append
 */
Soap.prototype.addBody = function (bodyObject) {//{{{
    var n,
        that = this;
    for (n in bodyObject) {
        if (bodyObject.hasOwnProperty(n)) {
            if (that.body.hasOwnProperty(n)) {
                //created and not prototype prop
                that.body[n].push(bodyObject[n]);
            } else if (undefined === that.body[n]) {
                //that hasn't been created yet
                that.body[n] = [bodyObject[n]];
            }
        }
    }
};//}}}

/**
 * Adds xml content to the Soap object's head
 * @TODO - this will overwrite all headers
 * @function Soap#addHeader
 * @param {object} headerObject - a header typically create with simpleAction
 * @example
 * var xml = Soap.create(),
 *     header = xml.simpleAction('SessionHeader', {
 *         session: that.sessionTimer.session
 *     });
 * xml.addHeader(header);
 */
Soap.prototype.addHeader = function (headerObject) {//{{{
    var n,
        that = this;
    for (n in headerObject) {
        if (headerObject.hasOwnProperty(n)) {
            if (that.header.hasOwnProperty(n)) {
                //created and not prototype prop
                that.header[n].push(headerObject[n]);
            } else if (undefined === that.header[n]) {
                //that hasn't been created yet
                that.header[n] = [headerObject[n]];
            }
        }
    }
};//}}}

/**
 * Creates and returns SOAP ready zObject to build on
 * @function Soap#createZObject
 * @param {string} name - the type of zOBject you are creating
 * @return Soap#ZObject
 */
Soap.prototype.createZObject = function (name) {
    return new Soap.prototype.ZObject(name);
};

/** 
 * @constructor Soap#ZObject
 * @returns {object} ZObject
 * @param {string} name - the type of zOBject you are creating
 */
Soap.prototype.ZObject = function (name) {
    this._attr = {
        'xsi:type': 'ns2:' + name
    };
};

/*TODO - what is this???
Soap.prototype.TemplateObject = function (header, body) {
};

Soap.prototype.createTemplateObject = function (header, body) {
    return new Soap.prototype.TemplateObject(header, body);
}; 
*/

/**
 * Filter out prototype properties, wrap xml and return.
 * This should happen immediately and be a direct method.
 * @function Soap#render
 * @return {string} XML string data
 */
Soap.prototype.render = function () {//{{{
    var obj = {},
        i = 0,
        that = this,
        n;
    for (n in that.header) {
        if (that.header.hasOwnProperty(n)) {
            obj['SOAP-ENV:Header'] = that.header;
            break;
        }
    }
    for (n in that.body) {
        if (that.body.hasOwnProperty(n)) {
            obj['SOAP-ENV:Body'] = that.body;
            break;
        }
    }
    for (n in that) {
        if (that.hasOwnProperty(n) && n !== 'header' && n !== 'body') {
            obj[n] = that[n];
        }
    }
    return buildXml('SOAP-ENV:Envelope', obj);
};//}}}

/**
 * Creates and returns SOAP ready zObject to build on
 * @function Soap#createSubscribeObject
 * @param {string} name - the type of subscribe object you are creating
 * @return Soap#SubscribeObject
 */
Soap.prototype.createSubscribeObject = function (name) {
    var attr = this._attr;
    return new Soap.prototype.SubscribeObject(name, attr);
};

/** 
 * @constructor Soap#SubscribeObject
 * @returns {object} SubscribeObject
 * @param {string} name - the type of zOBject you are creating
 */
Soap.prototype.SubscribeObject = function (name, attr) {//{{{
    this._attr = {
        'xsi:type': 'ns2:' + name,
        'xmlns:xsi': attr['xmlns:xsi'],
        'xmlns:ns2': attr['xmlns:ns2']
    };
};//}}}

/**
 * A subscribe action namespaced object
 * @constructor Soap#SubscribeAction
 */
Soap.prototype.SubscribeAction = function (attr) {//{{{
    this._attr = {
        'xmlns:ns1': attr['xmlns:ns1']
    };
};//}}}

/**
 * Creates a Subscribe action namespaced object
 * @function Soap#createSubscribeAction
 * @return {object} SubscribeAction
 */
Soap.prototype.createSubscribeAction = function () {//{{{
    var attr = this._attr;
    return new Soap.prototype.SubscribeAction(attr);
};//}}}

/**
 * Create a Zuora subscribe action
 * @function Soap#subscribeAction
 * @param {string} actionName - type of action to build
 * @param {object} actionObjects - objects to be added to the action
 */
Soap.prototype.subscribe = (function () {//{{{
    var that,
        rec,
        gobj,
        curObj,
        namespace,
        curIndex,
        init = function () {
            rec = [];
            gobj = {};
            curObj = {};
            namespace = [];
            curIndex = -1;
        },
        recurseObject = function (obj, type) {
            curIndex += 1;
            var a,
                n,
                ns,
                action,
                actionName,
                count;
            //console.log('=============================='.blue);
            //console.log('current index is: ' + curIndex);
            //console.log('type is:'.yellow, type);
            if (undefined !== type) {
                namespace.push('ns1:' + type);
            }
            //console.log('namespace depth: '.cyan, namespace.length, namespace, curIndex);
            for (n in obj) {
                if ('SubscribeOptions' === n) {
                    action = that.simpleAction(n, obj[n]);
                    actionName = 'ns1:' + n;
                    curObj[actionName] = action[actionName];
                    continue;
                }
                if (!obj.hasOwnProperty(n) || null === obj[n]) {
                    //console.log('skipping: ' + n);
                    continue;
                }
                if (undefined !== zuora.models[n] && 'SubscribeOptions' !== n) {
                    //console.log('checking model: '.red, n);
                    recurseObject(obj[n], n);
                    //console.log('index down: '.green, curIndex);
                    continue;
                }
                //console.log('adding:'.cyan, n, curIndex, count);
                count = 0;
                curObj = gobj;
                while (count < curIndex) {
                    //console.log('setting current index'.yellow, namespace[count]);
                    ns = namespace[count];
                    if (undefined === curObj[ns]) {
                        //console.log(' + setting namespace:'.yellow, ns);
                        curObj[ns] = {};
                    }
                    curObj = curObj[ns];
                    count += 1;
                }
                //console.log('setting currentObject: '.red, n);
                ns = 'ns1:' + n;
                curObj[ns] = that.createSubscribeObject(n);
                for (a in obj[n]) {
                    if (obj[n].hasOwnProperty(a)) {
                        curObj[ns]['ns2:' + a] = obj[n][a];
                    }
                }
            }
            curIndex -= 1;
            if (curIndex === -1) {
                //console.log('returning gobj');
                return gobj;
            }
        };
    return function (subscribes) {
        if (!subscribes instanceof Array) {
            throw new Error('Subscribe expects parameter 1 to be of type Array');
        }
        if (subscribes.length > 50) {
            throw new Error('Subscribe expects no more than 50 objects in parameter 1');
        }
        that = this;
        var i = 0,
            action = that.createSubscribeAction(),
            aobj;
        aobj = action['ns1:subscribes'] = [];
        for (i; i < subscribes.length; i++) {
            init();
            aobj.push(recurseObject(subscribes[i]));
        }
        return {
            'ns1:subscribe': action
        };
    }
}());//}}}

/**
 * Create a Zuora action: update, create, delete, etc...
 * @function Soap#action
 * @param {string} actionName - type of action to build
 * @param {array} actionList - Array of zuora objects to be added to the action
 */
Soap.prototype.action = function (actionName, actionList) {//{{{
    //TODO - consider having all calls made to action and routed to their corresponding methods
    var n,
        a,
        o = 0,
        type = '',
        obj = {},
        aobj = {
            'ns1:zObjects': []
        },
        actionObjects = {},
        cur,
        curObj;
    for (o; o < actionList.length; o++) {
        type = actionList[o].type;
        if (actionObjects[type] === undefined) {
            actionObjects[type] = [actionList[o]];
        } else {
            actionObjects[type].push(actionList[o]);
        }
    }
    //cycle through created account object types: Account, Contact, etc...
    for (n in actionObjects) {
        if (actionObjects.hasOwnProperty(n)) {
            //eg: Account Object
            curObj = actionObjects[n];
            for (o = 0; o < curObj.length; o++) {
                //create a new ZObject
                cur = Soap.prototype.createZObject(n);
                //filter own parameters and sort
                for (a in curObj[o]) {
                    if (curObj[o].hasOwnProperty(a)) {
                        cur['ns2:' + a] = curObj[o][a];
                    }
                }
                aobj['ns1:zObjects'].push(cur);
            }
        }
    }
    obj['ns1:' + actionName] = aobj;
    return obj;
};//}}}

/**
 * Create a Zuora simple action: login, header, etc...
 * @function Soap#simpleAction
 * @param {string} actionName - type of action to build
 * @param {object} actionObjects - objects to be added to the action
 */
Soap.prototype.simpleAction = function (actionName, actionObjects) {//{{{
    var n,
        a,
        obj = {},
        aobj = {},
        cur;
    for (n in actionObjects) {
        if (actionObjects.hasOwnProperty(n)) {
            aobj['ns1:' + n] = actionObjects[n];
        }
    }
    obj['ns1:' + actionName] = aobj;
    return obj;
};//}}}

module.exports = Soap;
//EOF soap.js
