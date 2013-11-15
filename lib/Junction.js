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
 * Stores all values that are no signals.
 *
 * @type {Object}
 * @private
 */
Junction.prototype._values = null;

/**
 * Stores all signals that have been created by the junction.
 *
 * @type {Object}
 * @private
 */
Junction.prototype._signals = null;

/**
 * The Junction's real constructor. You may override this in a plugin to hook into construction.
 */
Junction.prototype.constructor = function () {
    this._signals = {};
    this._values = {};
};

/**
 * Set a single or multiple values with one call.
 *
 * @param {String|Object} key or an object with key/value-pairs
 * @param {*=} value
 * @returns {Junction}
 */
Junction.prototype.set = function (key, value) {
    var obj;

    if (arguments.length === 1) {
        obj = key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                setter(this, key, this.setter(key, obj[key]));
            }
        }
    } else {
        setter(this, key, this.setter(key, value));
    }

    return this;
};

/**
 * Gets called for every value that changes (including changes by signals). Override
 * this method if you want to apply some normalizations on the new value.
 *
 * The returned value will be the new value, so make sure to always return something.
 *
 * @param {String} key
 * @param {*} value
 * @returns {*}
 */
Junction.prototype.setter = function (key, value) {
    return value;
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

    if (arguments.length > 0) {
        return this._values[key];
    }

    result = {};
    obj = this._values;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = this._values[key];
        }
    }

    return result;
};

/**
 * Removes all keys from the value store and sets all signals on undefined.
 *
 * @returns {Junction}
 */
Junction.prototype.reset = function () {
    var signals = this._signals,
        key;

    this._values = {};
    for (key in signals) {
        if (signals.hasOwnProperty(key)) {
            signals[key](undefined);
        }
    }

    return this;
};

/**
 * Removes the given key from the internal value store and sets the signal on undefined.
 *
 * @param {String} key
 * @returns {Junction}
 */
Junction.prototype.remove = function (key) {
    var signal;

    signal = this._signals[key];
    if (signal) {
        signal(undefined);
    }
    delete this._values[key];

    return this;
};

/**
 * Returns the signal instance to the given key.
 *
 * @param {String} key
 * @returns {Function}
 */
Junction.prototype.signal = function (key) {
    var signal = this._signals[key],
        self = this;

    if (!signal) {
        if (typeof this.Signal !== "function") {
            throw new Error("Cannot create signal: You need to configure a Signal-class.");
        }
        signal = new this.Signal();
        signal.setter = function setter(value) {
            return self.setter(key, value);
        };
        if (this._values.hasOwnProperty(key)) {
            signal(this._values[key]);
        }
        signal.subscribe(function onSignalChange(newValue) {
            self._values[key] = self.setter(key, newValue);
        });

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
        key;

    for (key in signals) {
        if (signals.hasOwnProperty(key)) {
            signals[key].dispose();
        }
    }

    this._signals = null;
    this._values = null;
    this.isDisposed = true;
};

/**
 * Calls the given function with the Junction as first argument and the given config (optionally). Plugins can be used
 * to hook into class methods by overriding them.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Function}
 */
Junction.use = function (plugin, config) {
    plugin(this, config);

    return this;
};

function setter(junction, key, value) {
    var signal = junction._signals[key];

    if (signal) {
        signal(value);
    } else {
        junction._values[key] = value;
    }
}

module.exports = Junction;