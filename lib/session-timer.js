/**
 * Author: Nicholas Riley
 * @desciption ZUORA API Bridge
 */
/** @constructor */
var SessionTimer = function () {
        var that = this;
        /**
         * Whether the session has been set or not
         * @type {object}
         * @alias SessionTimer#isSet
         */
        that.isSet = false;
        /**
         * The unique session key
         * @type {object}
         * @alias SessionTimer#session
         */
        that.session = null;
        /**
         * Time before the session was created
         * @type {object}
         * @alias SessionTimer#created
         */
        that.created = null;
        /**
         * Time the session will expire
         * @type {object}
         * @alias SessionTimer#expireTime
         */
        that.expireTime = null;
    };

/** 
 * @function SessionTimer#create
 */
SessionTimer.create = function () {
    return new SessionTimer();
};

/** 
 * Check if session timer has expired and renew 
 * @function SessionTimer#expired
 * @return {boolean} session expired
 */
SessionTimer.prototype.expired = function () {
    return (Date.now() >= this.expireTime);
};

/**
 * Set the session key and the time it was created
 * @function Zuora#set
 * @listens Zuora#loggedin
 * @param {object} sessionData - response from login
 */
SessionTimer.prototype.set = function (sessionData) {//{{{
    this.sessionTimer.session = sessionData.result.Session;
    this.sessionTimer.created = Date.now();
    //it expires in 15, but this is a potential race condition if set to 15
    this.sessionTimer.expireTime = this.sessionTimer.created + 1000 * 60 * 14;
    this.sessionTimer.isSet = true;
};//}}}

module.exports = SessionTimer;
//EOF session-timer.js
