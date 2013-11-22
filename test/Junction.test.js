"use strict";

var chai = require("chai"),
    sinon = require("sinon"),
    Junction = require("../" + require("../package.json").main),
    AlamidSignal = require("alamid-signal"),
    expect = chai.expect;

chai.Assertion.includeStack = true;
chai.use(require("sinon-chai"));

describe("Junction", function () {
    var junction;

    describe(".use(plugin, config?)", function () {
        var plugin,
            config;

        beforeEach(function () {
            plugin = sinon.spy();
            config = {};
        });

        it("should provide a plugin-interface", function () {
            Junction.use(plugin, config);
            expect(plugin).to.have.been.calledWith(Junction, config);
        });

        it("should be usable on other objects too", function () {
            var otherObj = {
                use: Junction.use
            };

            otherObj.use(plugin);
            expect(plugin).to.have.been.calledWith(otherObj);
        });

        it("should be chainable", function () {
            expect(Junction.use(function () {})).to.equal(Junction);
        });

    });

    describe(".prototype", function () {
        var givenValue;

        function Signal() {
            var listener;

            function signal(value) {
                if (arguments.length === 1) {
                    givenValue = value;
                    listener && listener(value);
                    return signal;
                } else {
                    return givenValue;
                }
            }
            signal.constructor = Signal;
            signal.subscribe = function (newListener) {
                listener = newListener;
            };

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
        
        describe(".constructor()", function () {

            it("should be an override-able function", function () {
                var constructor = Junction.prototype.constructor;

                expect(constructor).to.be.a("function");

                Junction.prototype.constructor = sinon.spy();
                junction = new Junction();
                expect(Junction.prototype.constructor).to.have.been.called;

                Junction.prototype.constructor = constructor;
            });

            it("should return an instance of Junction", function () {
                expect(new Junction()).to.be.an.instanceof(Junction);
            });

        });        

        describe(".isDisposed", function () {

            it("should be false by default", function () {
                expect(junction.isDisposed).to.equal(false);
            });

            it("should be true after junction.dispose() has been called", function () {
                junction.dispose();
                expect(junction.isDisposed).to.equal(true);
            });

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

        describe(".setter", function () {

            beforeEach(function () {
                junction.setter = sinon.stub().returns("it works");
            });

            it("should be called when set(key, value) is called and take the returned value as new value", function () {
                junction.setter = sinon.stub().returns("it works");

                junction.set("hello", "pirate");

                expect(junction.setter).to.have.been.calledOnce;
                expect(junction.setter).to.have.been.calledWith("hello", "pirate");
                expect(junction.get("hello")).to.equal("it works");
            });

            it("should be called for every key-value-pair and take the returned value as new value", function () {
                junction.set({
                    greeting: "Ahoy!",
                    age: 34,
                    attributes: {}
                });

                expect(junction.setter).to.have.been.calledThrice;
                expect(junction.setter.firstCall).to.have.been.calledWith("greeting", "Ahoy!");
                expect(junction.setter.secondCall).to.have.been.calledWith("age", 34);
                expect(junction.setter.thirdCall).to.have.been.calledWith("attributes", {});

                expect(junction.get()).to.eql({
                    greeting: "it works",
                    age: "it works",
                    attributes: "it works"
                });
            });

            it("should only by called once when there is also a signal", function () {
                junction.signal("name");
                junction.set("name", "Mighty pirate");

                expect(junction.setter).to.have.been.calledOnce;
            });

        });

        describe(".reset()", function () {

            beforeEach(function () {
                junction.set("greeting", "Ahoy!");
                junction.set("age", 34);
            });

            it("should remove all keys from the junction", function () {
                junction.reset();

                expect(junction.get()).to.eql({});
            });

            it("should set the key's signal to undefined", function () {
                var greeting = junction.signal("greeting"),
                    age = junction.signal("age");

                expect(greeting()).to.equal(34);
                junction.reset();
                expect(greeting()).to.equal(undefined);
            });

            it("should be chainable", function () {
                expect(junction.reset()).to.equal(junction);
            });
        });

        describe(".remove(key)", function () {

            beforeEach(function () {
                junction.set("greeting", "Ahoy!");
                junction.set("age", 34);
            });

            it("should remove the key from the junction", function () {
                junction.remove("greeting");

                expect(junction.get()).to.eql({
                    age: 34
                });
            });

            it("should not work different if a signal has previously been retrieved", function () {
                junction.signal("greeting");

                junction.remove("greeting");

                expect(junction.get()).to.eql({
                    age: 34
                });
            });

            it("should set the key's signal to undefined", function () {
                var greeting = junction.signal("greeting");

                expect(greeting()).to.equal("Ahoy!");
                junction.remove("greeting");
                expect(greeting()).to.equal(undefined);
            });

            it("should throw no error if the key is unknown", function () {
                expect(function () {
                    junction.remove("some unknown key");
                }).to.not.throw;
            });

            it("should be chainable", function () {
                expect(junction.remove("greeting")).to.equal(junction);
            });
        });

        describe(".signal(key)", function () {

            it("should return a signal", function () {
                var instance = junction.signal("greeting");

                expect(instance).to.be.an("function");
                expect(instance.constructor).to.equal(Signal);
            });

            it("should return the same signal instance multiple times", function () {
                var instance;

                instance = junction.signal("greeting");
                expect(junction.signal("greeting")).to.equal(instance);
            });

            it("should return a signal representing the value specified by key", function () {
                var greeting = junction.signal("greeting");

                expect(greeting()).to.equal(undefined);
                junction.set("greeting", "Ahoy!");
                expect(greeting()).to.equal("Ahoy!");
                expect(junction.get("greeting")).to.equal("Ahoy!");
            });

            it("should throw an error if the Signal-class is missing", function () {
                Junction.prototype.Signal = null;
                expect(function () {
                    junction.signal("greeting");
                }).to.throw("You need to configure a Signal-class");
                Junction.prototype.Signal = Signal;
            });

            it("should apply a setter to the signal which calls the Junction's setter", function () {
                var greeting;

                junction.setter = sinon.spy();
                greeting = junction.signal("greeting");

                greeting.setter("hello");

                expect(junction.setter).to.have.been.calledWith("greeting", "hello");
            });

            it("should update the junction's property when the signal changes", function () {
                var greeting = junction.signal("greeting");

                expect(junction.get()).to.eql({});

                greeting("hello");

                expect(junction.get("greeting")).to.equal("hello");
                expect(junction.get()).to.eql({
                    greeting: "hello"
                });
            });

            describe("with alamid-signal", function () {
                before(function () {
                    Junction.prototype.Signal = AlamidSignal;
                });

                after(function () {
                    Junction.prototype.Signal = Signal;
                });

                it("should return the same signal instance multiple times", function () {
                    var instance;

                    instance = junction.signal("greeting");
                    expect(junction.signal("greeting")).to.equal(instance);
                });

                it("should return a signal representing the value specified by key", function () {
                    var greeting = junction.signal("greeting");

                    expect(greeting()).to.equal(undefined);
                    junction.set("greeting", "Ahoy!");
                    expect(greeting()).to.equal("Ahoy!");
                    expect(junction.get("greeting")).to.equal("Ahoy!");
                });
            });

        });

        describe(".dispose()", function () {
            var name,
                greeting;

            beforeEach(function () {
                name = junction.signal("name");
                greeting = junction.signal("greeting");
                name.dispose = sinon.spy();
                greeting.dispose = sinon.spy();
                junction.set("age", 99);
            });

            it("should call dispose() on all signals that have been created by the junction", function () {
                junction.dispose();

                expect(name.dispose).to.have.been.called;
                expect(greeting.dispose).to.have.been.called;
            });

            it("should remove the internal signals reference", function () {
                junction.dispose();
                expect(junction._signals).to.equal(null);
                expect(junction._values).to.equal(null);
            });

        });

    });

});