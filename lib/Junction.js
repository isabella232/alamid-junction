"use strict";

/**
 * A junction groups several signals so they can easily be modified and retrieved.
 *
 * @constructor
 */
function Junction() {
    Junction.prototype.constructor.apply(this, arguments);
}

/**
 * The signal class. This function will be invoked with "new" every time a signal
 * is created.
 *
 * @type {Function}
 */
Junction.prototype.Signal = null;

/**
 * Signalizes whether the junction has already been disposed. This flag is useful
 * if you don't know if it save to call a junction method like signal() without causing a crash.
 *
 * @type {boolean}
 * @readonly
 */
Junction.prototype.isDisposed = false;

/**
 * The Junction's real constructor. You may override this in a plugin to hook into construction.
 */
Junction.prototype.constructor = function () {
    this._signals = {};
};

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
 * Resets all keys to the given value. If no value is given, all keys will have the value undefined.
 *
 * @param {*=} value
 * @returns {Junction}
 */
Junction.prototype.reset = function (value) {
    var obj = this._signals,
        key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            this.setter(key, value);
        }
    }

    return this;
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

/**
 * Call this function is you don't need the junction anymore.
 *
 * Calls dispose() on all signals that have been created by this junction
 * and removes all references.
 */
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

    this._signals = null;
    this.isDisposed = true;
};

/**
 * Calls the given function with the Junction as first argument and the given config (optionally). Plugins can be used
 * to hook into class methods by overriding them.
 *
 * You may call this function multiple times with the same plugin, the plugin will only be applied once.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Function}
 */
Junction.use = function (plugin, config) {
    this._plugins = this._plugins || [];

    if (this._plugins.indexOf(plugin) === -1) {
        plugin(this, config);
        this._plugins.push(plugin);
    }

    return this;
};

/**
 * Determines if the given value is a signal and if it was created by this junction.
 *
 * @private
 * @param {*} value
 * @returns {boolean}
 */
function isSignal(value) { /* jshint validthis: true */
    return Boolean(value) && value.junction === this;
}

module.exports = Junction;