"use strict";

/**
 * A junction groups several signals so they can easily be modified and retrieved.
 *
 * @constructor
 */
function Junction() {
    this._signals = {};
}

/**
 * The signal class. This function will be invoked with "new" every time a signal
 * is created.
 *
 * @type {Function}
 */
Junction.prototype.Signal = null;

/**
 * Set a single or multiple values with one call.
 *
 * @param {String|Object} key or an object with key/value-pairs
 * @param {*} value
 * @returns {Junction}
 */
Junction.prototype.set = function (key, value) {
    var obj;

    if (arguments.length === 1) {
        obj = key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.setter(key, obj[key]);
            }
        }
    } else {
        this.setter(key, value);
    }

    return this;
};

/**
 * Will be invoked with a key and the new value. Override this method to modify
 * the way values are set.
 *
 * @private
 * @param {String} key
 * @param {*} value
 * @private
 */
Junction.prototype.setter = function (key, value) {
    var signal = this._signals[key];

    if (isSignal.call(this, signal)) {
        signal(value);
    } else {
        this._signals[key] = value;
    }
};

/**
 * Retrieve one or all values.
 *
 * @param {String=} key
 * @returns {*}
 */
Junction.prototype.get = function (key) {
    var obj,
        result;

    if (arguments.length === 0) {
        obj = this._signals;
        result = {};
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = this.getter(key);
            }
        }
        return result;
    }

    return this.getter(key);
};

/**
 * Will be invoked with a key. Override this method if you want to modify the way how values
 * are retrieved.
 *
 * @param {String} key
 * @returns {*}
 * @private
 */
Junction.prototype.getter = function (key) {
    var signal = this._signals[key];

    return (isSignal.call(this, signal))? signal() : signal;
};

/**
 * Returns the signal instance to the given key.
 *
 * @param {String} key
 * @returns {Function}
 */
Junction.prototype.signal = function (key) {
    var signal = this._signals[key];

    if (isSignal.call(this, signal) === false) {
        signal = new this.Signal();
        signal.junction = this;
        signal(this.getter(key));
        this._signals[key] = signal;
    }

    return signal;
};

Junction.prototype.dispose = function () {
    var signals = this._signals,
        signal,
        key;

    for (key in signals) {
        if (signals.hasOwnProperty(key)) {
            signal = signals[key];
            if (isSignal.call(this, signal)) {
                signal.dispose();
            }
        }
    }
};

function isSignal(signal) { /* jshint validthis: true */
    return Boolean(signal) && signal.junction === this;
}

module.exports = Junction;