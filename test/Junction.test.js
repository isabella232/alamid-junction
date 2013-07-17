"use strict";

var chai = require("chai"),
    Junction = require("../" + require("../package.json").main),
    AlamidSignal = require("alamid-signal"),
    expect = chai.expect;

chai.use(require("sinon-chai"));

describe("Junction", function () {
    var junction,
        givenValue;

    function Signal() {
        function signal(value) {
            if (arguments.length === 1) {
                givenValue = value;
                return signal;
            } else {
                return givenValue;
            }
        }
        signal.constructor = Signal;

        return signal;
    }

    before(function () {
        Junction.prototype.Signal = Signal;
    });
    beforeEach(function () {
        junction = new Junction();
    });
    after(function () {
        delete Junction.prototype.Signal;
    });

    it("should be an instance of Junction", function () {
        expect(junction).to.be.an.instanceof(Junction);
    });

    describe(".get() before data has been set", function () {

        it("should return an empty object", function () {
            expect(junction.get()).to.be.empty;
        });

    });

    describe(".get(key) before data has been set", function () {

        it("should return undefined", function () {
            expect(junction.get("name")).to.be.undefined;
        });

    });

    describe(".set(object)", function () {

        it("should return this", function () {
            expect(junction.set({ type: "Pirate" })).to.equal(junction);
        });

    });

    describe(".set(key, value)", function () {

        it("should return this", function () {
            expect(junction.set("hello", true)).to.equal(junction);
        });

    });

    describe(".get() after data has been set", function () {
        var data;

        beforeEach(function () {
            data = {
                greeting: "Ahoy!",
                age: 34,
                attributes: {}
            };
            junction.set(data);
        });

        it("should return all data set", function () {
            expect(junction.get()).to.deep.equal(data);

            data.type = "Pirate";
            data.greeting = "Arr!";
            junction.set(data);

            expect(junction.get()).to.deep.equal(data);
        });

    });

    describe(".get(key) after data has been set", function () {

        beforeEach(function () {
            junction.set("greeting", "Ahoy!");
            junction.set("age", 34);
        });

        it("should return the stored value", function () {
            expect(junction.get("greeting")).to.equal("Ahoy!");
            expect(junction.get("age")).to.equal(34);
        });

        it("should still return undefined for unset keys", function () {
            expect(junction.get("victims")).to.equal(undefined);
        });

    });

    describe(".provide(key)", function () {

        it("should return a signal", function () {
            var instance = junction.provide("greeting");

            expect(instance).to.be.an("function");
            expect(instance.constructor).to.equal(Signal);
        });

        it("should return the same signal instance multiple times", function () {
            var instance;

            instance = junction.provide("greeting");
            expect(junction.provide("greeting")).to.equal(instance);
        });

        it("should return a signal representing the value specified by key", function () {
            var greeting = junction.provide("greeting");

            expect(greeting()).to.equal(undefined);
            junction.set("greeting", "Ahoy!");
            expect(greeting()).to.equal("Ahoy!");
            expect(junction.get("greeting")).to.equal("Ahoy!");
        });

    });

    describe(".provide(key) with alamid-signal", function () {

        before(function () {
            Junction.prototype.Signal = AlamidSignal;
        });

        after(function () {
            Junction.prototype.Signal = Signal;
        });

        it("should return the same signal instance multiple times", function () {
            var instance;

            instance = junction.provide("greeting");
            expect(junction.provide("greeting")).to.equal(instance);
        });

        it("should return a signal representing the value specified by key", function () {
            var greeting = junction.provide("greeting");

            expect(greeting()).to.equal(undefined);
            junction.set("greeting", "Ahoy!");
            expect(greeting()).to.equal("Ahoy!");
            expect(junction.get("greeting")).to.equal("Ahoy!");
        });

    });

});