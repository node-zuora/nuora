/**
 * Author: Nicholas Riley
 * ZUORA API Bridge
 */
"use strict";
var zuora,//{{{
    nuora,
    config,
    log,
    fs = require('fs'),
    colors = require('colors'),
    path = require('path'),
    https = require('https'),
    parseXml = require('libxml-to-js'),
    EventEmitter = require('events').EventEmitter,
    Soap = require('./soap'),
    SessionTimer = require('./session-timer'),
    /** @constructor */
    Zuora = function () {
        zuora = this;
        if (undefined === config || !(config instanceof Object)) {
            throw new Error('Zuora constructor expects parameter 1 to be a configuration object');
        }
        zuora.nuora = nuora;
        zuora.config = config;
        zuora.sessionTimer = SessionTimer.create();
        zuora.on('loggedin', zuora.sessionTimer.set);
    },
    /**
     * @constructor
     * @param {object} result - the result from the ResultObject
     * @return {array|object} Values are set depending on the original result
     */
    Result = function (result) {
        var that = this,
            n,
            i = 0,
            res,
            cur,
            curRes,
            attr,
            matches;

        //TODO should be DRY
        //log.info('returning result');
        //log.info(result);
        if (result instanceof Array) {
            res = [];
            for (i; i < result.length; i++) {
                cur = result[i];
                curRes = {};
                for (n in cur) {
                    if (cur.hasOwnProperty(n)) {
                        matches = n.match(/ns\d:([\w ]+)/);
                        if (null !== matches) {
                            if (matches[1] === 'records') {
                                curRes[matches[1]] = Result.create(cur[n]);
                            } else {
                                curRes[matches[1]] = cur[n];
                            }
                        } else {
                            if ('@' === n) {
                                //curRes[n] = that.parseAttributes(cur[n]);
                                continue;
                            } else {
                                curRes[n] = cur[n];
                            }
                        }
                    }
                }
                res.push(curRes);
            }
            return res;
        }
        for (n in result) {
            if (result.hasOwnProperty(n)) {
                matches = n.match(/ns\d:([\w ]+)/);
                if (null !== matches) {
                    if (matches[1] === 'records') {
                        that[matches[1]] = Result.create(result[n]);
                    } else {
                        that[matches[1]] = result[n];
                    }
                } else {
                    if ('@' === n) {
                        //that[n] = that.parseAttributes(result[n]);
                        continue;
                    } else {
                        that[n] = result[n];
                    }
                }
            }
        }
    },
    /**
     * Creates a new result object from an xmlObject
     * @constructor
     * @property ResultObject.raw - Raw XML data
     * @property ResultObject.$ - XML Object, parsed data
     * @property ResultObject.result - if success this will be an object and error will be null
     * @property ResultObject.error - if error, this will have the error object and result will be null
     */
    ResultObject = function (xmlObject, dataString) {
        var result;
        this.raw = dataString;
        this.$ = xmlObject;
        this.result = this.error = null;
        if (undefined === xmlObject['soapenv:Body']) {
            log.info(xmlObject);
            throw new Error('Unrecognized SOAP response');
        }
        result = this.reduce(xmlObject);
        if (undefined !== result.faultcode || undefined !== result.Errors) {
            this.error = result;
        } else {
            if (undefined !== result.size) {
                result.size = Number(result.size);
            }
            if (undefined !== result.done) {
                result.done = result.done === 'true' ? true : false;
            }
            if (undefined !== result.Success) {
                result.success = result.Success === 'true';
                delete result.Success;
            }
            this.result = result;
        }
    };//}}}

Zuora.prototype = new EventEmitter();

/** 
 * Create a result from the "result" property of a ResultObject
 * this may sound confusing...The request returns a response, the
 * response is parsed into an object and sent to createResultObject
 * which takes some nasty object properties and normalizes them. In 
 * creating a ResultObject, the result value is set to a Result object
 * which live in a ResultObject so -> ResultObject.result ... make sense?
 * @function Result#create
 * @param {object|array} Given an object or array, will normalize properties
 */
Result.create = function (res) {
    return new Result(res);
};

/**
 * Result objects often, if not always, have attributes that may be
 * useful for verifying response data. This will parse any NS values ('ns:')
 * into human readable names
 * @param {object} attr - The attribute object from the result
 * @returns {object} normalized attribute object
 */
Result.prototype.parseAttributes = function (attr) {
    var n,
        obj = {};
    for (n in attr) {
        if (attr.hasOwnProperty(n)) {
            obj[n] = attr[n].replace(/^ns(\d)*:/, '');
        }
    }
    return obj;
};

/**
 * Reduces the result object
 * @param {object} res - The result object from a response(query) 
 * @returns {object} normalized result object
 */
ResultObject.prototype.reduce = function (res) {
    var n,
        that = this;
    for (n in res) {
        if (res.hasOwnProperty(n)) {
            log.info(n, n.search(/:(result|Fault)/));
            if (n.search(/:(result|Fault)/) > -1) {
                return Result.create(res[n]);
            }
            return that.reduce(res[n]);
        }
    }
};

/**
 * Build and return a new Zuora instance object
 * @function Zuora.build
 * @param {object} config - the Zuora configuration file
 * @return ZuoraObject
 */
Zuora.init = function (nuoraInstance) {
    nuora = nuoraInstance;
    config = nuora.config.zuora;
    log = nuora.log;
    return new Zuora();
};

/**
 * Holds a list of normalized field names refernced
 * with lower case keys
 */
Zuora.prototype.normalizedNames = {};

/**
 * Will return a zuora time string
 * 2015-03-19T07:54:13.384Z
 * @function Zuora#time
 * @returns {string} time - an ISO time string.
 */
Zuora.prototype.time = function () {
    return new Date().toISOString();
};

/**
 * Given a path to a WSDL file, this will load, parse and fire a 
 * 'ready' event on the Zuora instance object
 * @function Zuroa#initialize
 * @param {string} wsdlPath - path to the WSDL file
 */
Zuora.prototype.initialize = function (wsdlPath) {//{{{
    log.info('Initializing Zuora Instance...'.cyan);
    fs.readFile(wsdlPath, function (err, data) {
        if (err) {
            log.info(err);
            throw new Error('Could not initialize WSDL');
        } else {
            log.info('Parsing WSDL...'.cyan);
            zuora.parseWSDL(data);
        }
    });
};//}}}

/**
 * Given an XML buffer, will parse and set Zuora objects
 * @function Zuora#parseWSDL
 * @param {object} buffer - a readFile buffer of the WSDL file
 */
Zuora.prototype.parseWSDL = function (buffer) {//{{{
    var n,
        name,
        b = 0,
        builds = ['objectProps', 'models'],
        build,
        bindBuilder,
        FactoryObject,
        data = buffer.toString(),
        matchDefinitions = data.match(/<definitions ([\w:]+=[\s\S]*?"+?)>/m),
        matchObjects = data.match(/(<schema.* targetNamespace="http:\/\/object.api.zuora.com\/">[\s\S]*?<\/schema>)/m),
        matchModels = data.match(/(<schema.* targetNamespace="http:\/\/api.zuora.com\/">[\s\S]*?<\/schema>)/m),
		matchEndpoint = data.match(/soap:address location="(.*)"/),
        matchName = /name="([a-zA-Z0-9_\-]+)"/,
        doubleQuote = /"/g,
        matchObject = /<sequence>([\s\S]*?)<\/sequence>/m,
        getProps = function (elString) {
            var match = elString.match(matchName);
            if (null !== match && undefined !== match[1]) {
                return match[1];
            }
            return false;
        },
		hasCapture = function (arr) {
			return arr.length && arr.length > 1;
		},
        trim = function (elStr) {
            return elStr.trim().replace(doubleQuote, '');
        };
        //matchFaults = data.match(/(<schema.* targetNamespace="http:\/\/fault.api.zuora.com\/">[\s\S]*?<\/schema>)/m);
    if (!hasCapture(matchObjects) || !hasCapture(matchModels) || !hasCapture(matchDefinitions) || !hasCapture(matchEndpoint)) {
        throw new Error('Could not parse WSDL Objects');
    }

    FactoryObject = function (objectType) {
        var l = 0,
            list = objectType.match(matchObject)[1]
                .split('\n')
                .map(getProps)
                .filter(Boolean);
        //every object has an Id, that should be the first field
        this.Id = null;
        for (l; l < list.length; l++) {
            //TODO can we parse type and set this value accordingly?
            this[list[l]] = null;
            zuora.normalizedNames[list[l].toLowerCase()] = list[l];
        }
    };
    //TODO - precompile regex
    build = function (type, schemaString) {//{{{
        var obj = {},
            i = 0,
            p = 0,
            props,
            sequence,
            matches,
            cur,
            objectTypes = schemaString.match(/[\s\t ]*<complexType name="[a-zA-Z0-9_\-]+"[\s\t ]*>[\s\S]*?<\/complexType>/gm),
            key,
            value;
        if (type === 'definitions') {
            matches = schemaString.split('\n').map(trim);
            for (i; i < matches.length; i++) {
                key = matches[i].split('=');
                obj[key[0]] = key[1];
            }
        } else {
            for (i; i < objectTypes.length; i++) {
                matches = objectTypes[i].match(/name="([a-zA-Z0-9_\-]+)"/);
                obj[matches[1]] = new FactoryObject(objectTypes[i]);
                //get props from sequence elem
            }
        }
        return obj;
    };//}}}
    /**
     * Build a factory method to provide object
     * constructors using the wsdl
     * @param {string} ref - the object reference name [objectProps, models]
     * @param {string} type - the type of object we are mocking
     */
    bindBuilder = function (ref, type) {//{{{
        var list = zuora[ref][type],
            mixins,
            i,
            sortedList,
            fnc = function (params) {
                var n,
                    norm,
                    builder = this;
                for (n in list) {
                    builder[n] = list[n];
                }
                for (n in params) {
                    if (params.hasOwnProperty(n)) {
                        norm = n[0].toUpperCase() + n.slice(1);
                        if (!list.hasOwnProperty(norm)) {
                            throw new Error('Invalid Zuora object ' + type + ' has no property: ' + norm);
                        }
                        builder[norm] = params[n];
                    }
                }
            };
        //add mixins to list object
        //TODO this needs more testing
        if (zuora.config.wsdlMixins && undefined !== zuora.config.wsdlMixins[type]) {
            mixins = zuora.config.wsdlMixins[type];
            i = 0;
            sortedList = mixins.concat(Object.keys(list)).sort();
            list = {};
            log.info('adding mixin'.red, type, mixins);
            for (i; i < sortedList.length; i++) {
                list[sortedList[i]] = null;
            }
        }
        fnc.prototype.type = type;
        return fnc;
    };//}}}
    //sort and parse data
    zuora.objectProps = build('objects', matchObjects[1]);
    zuora.models = build('actions', matchModels[1]);
    zuora.definitions = build('definitions', matchDefinitions[1]);
	zuora.config.endpoint = matchEndpoint[1];
    zuora.builder = {};
    //bind the object functions to this builder instance
    for (b; b < builds.length; b++) {
        name = builds[b];
        for (n in zuora[name]) {
            if (zuora[name].hasOwnProperty(n)) {
                zuora.builder[n] = bindBuilder(name, n);
            }
        }
    }
    //initialize the SOAP API
    Soap.initialize(zuora);
    zuora.soap = Soap;
    zuora.emit('ready');
};//}}}

/**
 * Loosely filter an object by it's keys to return only properties
 * found in the Zuora object <type>
 * @function Zuora#filterObject
 * @param {string} type - type of Zuora API object
 * @param {object} obj - the object to be filtered
 * @returns {object} the filtered Zuora object
 */
Zuora.prototype.filterObject = function (type, obj) {//{{{
    var prop,
        name,
        builder,
        zuora = this,
        clean = {};
    log.info('Zuora.filterObject < ', obj);
    if (undefined === zuora.builder[type]) {
        log.warn('Zuora.filterObject : invalid type ', type);
        return false;
    }
    builder = zuora.objectProps[type];
    for (prop in obj) {
        name = zuora.normalizedNames[prop.toLowerCase()];
        if (builder.hasOwnProperty(name)) {
            clean[prop] = obj[prop];
        }
    }
    log.info('Zuora.filterObject > ', clean);
    return clean;
};//}}}

/**
 * A strict way to create Zuora API objects
 * @function Zuora#createObject
 * @param {string} type - type of Zuora API object
 * @param {object} params - the parameters to check and set on the Zuora API object
 * @example
 * var accountObject = zuora.createObject('Account', {
 *         name: 'Nick Foo',
 *         notes: 'hello world!',
 *         status: 'Draft'
 *     });
 */
Zuora.prototype.createObject = function (type, params) {//{{{
    if (undefined !== zuora.builder[type]) {// && undefined !== params) {
        return new zuora.builder[type](params);
    }
    throw new Error('Cannot create object of type: ' + type);
};//}}}


/**
 * Given as result object, will return a more user friendly
 * version of the same object with the properties raw, result, error
 * @function Zuora#createResultObject 
 * @param {object} data - data object from the result of a query
 * @returns {object} Manageable ResultObject
 */
Zuora.prototype.createResultObject = function (data) {
    return new ResultObject(data);
};

/**
 * Send XML Soap to Zuora
 * @function Zuora#send
 * @param {object} xmlObject - Soap instance
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.send = function (xmlObject, callback, bypassAuth) {//{{{
    log.info('Sending Zuora>>>'.cyan);
    var handler = function () {
            var xml = xmlObject,
                bypass = (undefined === bypassAuth) ? false : bypassAuth,
                req,
                header,
                xmlString,
                type,
                requestHandler = function (res) {
                    zuora.requestHandler(res, callback);
                };
            //add session headers only if sessionTimer is set and not bypassing auth
            if (zuora.sessionTimer.isSet && !bypass) {
                header = xml.simpleAction('SessionHeader', {
                    session: zuora.sessionTimer.session
                });
                xml.addHeader(header);
            }
            xmlString = xml.render();
            log.info(xmlString);
            xml.options['Content-Length'] = Buffer.byteLength(xmlString);
            req = https.request(xml.options, requestHandler);
            req.write(xmlString);
            //log.info(req);
            req.end();
        };
    //session expired! login and and run send
    if (zuora.sessionTimer.isSet && zuora.sessionTimer.expired()) {
        zuora.sessionTimer.isSet = false;
        log.info('Session Expired -- attempting to renew'.yellow);
        zuora.login(handler);
    } else {
        handler();
    }
};//}}}

/**
 * Handles https requests made @{@link Zuora#send}
 * @function Zuora#requestHandler
 * @param {object} res - the response object fromt the server
 */
Zuora.prototype.requestHandler = function (response, callback) {//{{{
    var data = '',
        responseHandler = function () {
            log.info('response received');
            log.info(data.toString());
            log.info('running callback');
            var _callback = callback,
                dataString = data.toString(),
                parseHandler = function (err, xmlObject) {
                    log.info('callbackHandler initiated');
                    if (err) {
                        log.info('Error occured parsing data for requestHandler'.red, err);
                        if (typeof _callback === 'function') {
                            _callback(err);
                        }
                    } else if (typeof _callback === 'function') {
                        var res = zuora.createResultObject(xmlObject);
                        res.raw = dataString;
                        _callback(res.error, res);
                    }
                };
            //xml to js
            parseXml(dataString, parseHandler);
        };
    log.info('requestHandler -- waiting for response'.cyan);
    //reasponse from zuora
    response.on('data', function (chunk) {
        data += chunk;
    });
    response.on('end', responseHandler);
};//}}}

/**
 * Login and get 
 * TODO - session expire time = 15 minutes, refresh if expired
 * @function Zuora#login
 * @fires Zuora#loggedin
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.login = function (callback) {//{{{
    var xml = Soap.create(),
        body = xml.simpleAction('login', {
            username: zuora.config.username,
            password: zuora.config.password
        }, false),
        handler = function (err, data) {
            if (err) {
                log.info('Error logging in to service', err);
                if (typeof callback === 'function') {
                    callback(err, data);
                }
            } else {
                zuora.emit('loggedin', data);
                if (typeof callback === 'function') {
                    callback(err, data);
                }
            }
        };
    xml.addBody(body);
    zuora.send(xml, handler);
};//}}}

/**
 * Perform a query
 * @function Zuora#query
 * @param {string} queryString - the query to perform
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.query = function (queryString, callback) {//{{{
    var zuora = this,
        xml = Soap.create(),
        fields = queryString.split(/(select | from)/g)[2].split(', ').map(function(str){return str.toLowerCase()}),
        limit = queryString.match(/ limit (\d+)/),
        header,
        body;
    if (null !== limit) {
        queryString = queryString.replace(/ limit \d+/, '');
        limit = limit[1];
        header = xml.simpleAction('QueryOptions', {
            batchSize: limit
        });
        xml.addHeader(header);
    }
    body = xml.simpleAction('query', {
        queryString: queryString
    });
    xml.addBody(body);
    zuora.send(xml, zuora.createQueryHandler(fields, limit, callback));
};//}}}

var QueryHandler = function (zuora, fields, limit, callback) {
        var that = this;
        that.zuora = zuora;
        that.fields = fields;
        that.limit = limit;
        that.callback = callback;
        that.result = [];
        that.responseHandler = function (err, data) {
            var i = 0,
                f,
                fieldSize = fields.length,
                cur,
                res,
                curField,
                normField,
                size,
                result;
            if (!err) {
                result = data.result.records;
                size = result.length;
                //console.log('results', result);
                //console.log('fields', fields);
                for (i; i < size; i++) {
                    //current row
                    cur = result[i];
                    res = {};
                    f = 0;
                    //console.log('filtering', cur);
                    for (f; f < fieldSize; f++) {
                        curField = fields[f];
                        //console.log('checking field', curField, zuora.normalizedNames[curField]);
                        normField = zuora.normalizedNames[curField];
                        res[normField] = undefined === cur[normField] ? null : cur[normField];
                    }
                    result[i] = res;
                }
                data.result.records = result;
                if (result instanceof Array) {
                    that.result = that.result.concat(result);
                } else {
                    that.result.push(result);
                }
            }
            if (undefined !== data.result.queryLocator) {
                that.queryLocator = data.result.queryLocator;
            }
            that.callback.call(that, err, data);
        };
        return that.responseHandler;
    };

QueryHandler.prototype.more = function () {
    log.info('querying more');
    var query = this,
        xml = Soap.create(),
        header,
        body = xml.simpleAction('queryMore', {
            queryLocator: query.queryLocator
        });
    if (query.limit) {
        header = xml.simpleAction('QueryOptions', {
            batchSize: query.limit
        });
    }
    xml.addHeader(header);
    xml.addBody(body);
    zuora.send(xml, query.responseHandler);
};

Zuora.prototype.createQueryHandler = function (fields, limit, callback) {
    var zuora = this;
    return new QueryHandler(zuora, fields, limit, callback);
};

/**
 * Starts an endless prompt
 * @function Zuora#queryPrompt
 * @param {string} queryString - the query to perform
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.queryPrompt = function (interactive) {//{{{
    var QueryPrompt = require('./query-prompt'),
        qp = QueryPrompt.start(),
        display = function (err, data) {
            if (err) {
                if (interactive) {
                    debugger;
                } else {
                    console.log(err, data);
                }
            } else {
                if (interactive) {
                    debugger;
                } else {
                    console.log(data.result.records);
                }
            }
            qp.read();
        },
        handler = function (sql) {
            zuora.query(sql, display);
        };
    qp.on('read', handler);
    return qp;
};//}}}

/**
 * Perform an update action
 * @function Zuora#update
 * @param {string} type - Zuora object you wish to update
 * @param {string} accountNumber - Zuora user account number
 * @param {object} params - fields to be updated
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.update = function (type, accountNumber, params, callback) {//{{{
    var field = '',
        sql,
        update;
    if (type === 'Account') {
        field = 'Id';
    }
    if (type === 'Contact') {
        field = 'BillToId';
    }
    sql = "select " + field + " from Account where AccountNumber = '" + accountNumber + "'";
    update = function (err, data) {
        if (err) {
            callback(err, data);
        } else {
            var id = data.result.records[field],
                soap = Soap.create(),
                obj = {},
                body;
            params.Id = id;
            obj = zuora.createObject(type, params);
            body = soap.action('update', [obj]);
            soap.addBody(body);
            zuora.send(soap, callback);
        }
    };
    zuora.query(sql, update);
};//}}}

/** 
 * @function Zuora#createSoap
 * @return {object} new Zuora instance object
 */
Zuora.prototype.createSoap = Soap.create;

/** 
 * @function Zuora#createZObject
 * @return {object} new Zuora ZObject
 */
Zuora.prototype.createZObject = Soap.prototype.createZObject;

/**
 * Builds out Zuora SubscribeRequest object into a subscription
 * @function Zuora#createSubscriptionObject
 * @param {object} Zuora SubscribeRequest object
 * @returns {object} normalized Zuora subscription object
 * subscribe[subscribes][objects|subscriptionData]
 */
Zuora.prototype.subscriptionObject = function (subscription) {
    if (undefined === subscription || !subscription instanceof this.builder.SubscribeRequest) {
        throw new Error('Invalid subscription object, expected SubscribeRequest');
    }
    var n,
        cur,
        zuora = this,
        objects = {},
        sortedSubscriptionData,
        sortSubscriptionData = function (subscriptionData) {//{{{
            var d,
                r,
                ratePlanData,
                rates = {},
                data = {};
            for (d in subscriptionData) {
                if (subscriptionData.hasOwnProperty(d)) {
                    if ('RatePlanData' === d) {
                        ratePlanData = subscriptionData[d];
                        for (r in ratePlanData) {
                            if (ratePlanData.hasOwnProperty(r)) {
                                rates[r] = zuora.createObject(r, ratePlanData[r]);
                            }
                        }
                        cur = zuora.createObject('RatePlanData', rates);
                    } else {
                        cur = zuora.createObject(d, subscriptionData[d]);
                    }
                    data[d] = cur;
                }
            }
            return data;
        };//}}}
    for (n in subscription) {
        if (subscription.hasOwnProperty(n) && undefined !== zuora.builder[n] && null !== subscription[n]) {
            if ('SubscriptionData' === n) {
                cur = zuora.createObject('SubscriptionData', sortSubscriptionData(subscription[n]));
            } else {
                cur = zuora.createObject(n, subscription[n]);
            }
            //mutate
            subscription[n] = cur;
        }
    }
    return subscription;
};

/**
 * Delete a Zuora object
 * @function Zuora#delete
 * @param {object} type - Object for delete
 * @param {object} idList - Array of object Id's
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.delete = function (type, idList, callback) {
    var zuora = this,
        max = 50,
        list,
        soap,
        body;
    while (idList.length > 0) {
        list = idList.splice(0, 50);
        soap = zuora.soap.create();
        body = soap.simpleAction('delete', {
            type: type,
            ids: list
        });
        soap.addBody(body);
        if (idList.length === 0) {
            zuora.send(soap, callback);
        } else {
            zuora.send(soap);
        }
    }
};

/**
 * Perform a subscribe action
 * @function Zuora#subscribe
 * @param {object} params - Object for subscription
 * @param {function} callback - the callback function to be issued on success/error
 */
Zuora.prototype.subscribe = function (params, callback) {
    var zuora = this,
        subscribe = zuora.createObject('SubscribeRequest', params),
        body,
        subscribes,
        soap = zuora.soap.create();
    subscribes = zuora.subscriptionObject(subscribe);
    body = soap.subscribe([subscribes]);
    soap.addBody(body);
    zuora.send(soap, callback);
};

module.exports = Zuora;
//EOF lib/zuora.js
