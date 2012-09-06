"use strict";
var it = require('it'),
    assert = require('assert'),
    comb = require("index"),
    Promise = comb.Promise,
    PromiseList = comb.PromiseList;


it.describe("comb#executeInOrder", function (it) {


    var staticValueFunction = function (value) {
        return comb.argsToArray(arguments).join(" ");
    };

    var promiseValueFunction = function (value) {
        var ret = new comb.Promise();
        setTimeout(comb.hitch(ret, "callback", comb.argsToArray(arguments).join(" ")), 100);
        return ret;
    };

    var hash = {
        staticValueFunction:staticValueFunction,
        promiseValueFunction:promiseValueFunction
    };

    var TestClass = comb.define(null, {
        instance:{

            publicValue:"publicValue",

            __privateValue:"privateValue",

            constructor:function (count) {
                this._instanceCount = count || 0;
            },

            hello:function () {
                return "hello" + this._instanceCount;
            },

            helloPromise:function () {
                return promiseValueFunction("hello" + this._instanceCount);
            },

            world:function () {
                return "world" + this._instanceCount;
            },

            worldPromise:function () {
                return promiseValueFunction("world" + this._instanceCount);
            },

            setters:{
                pseudoPublicValue:function (value) {
                    return this.__privateValue = value;
                }
            },

            getters:{
                pseudoPublicValue:function () {
                    return this.__privateValue;
                }
            }
        },

        static:{

            publicValue:"publicValue",

            __privateValue:"privateValue",

            hello:function () {
                return "hello";
            },

            helloPromise:function () {
                return promiseValueFunction("hello");
            },

            world:function () {
                return "world";
            },

            worldPromise:function () {
                return promiseValueFunction("world");
            },

            setters:{
                pseudoPublicValue:function (value) {
                    return this.__privateValue = value;
                }
            },

            getters:{
                pseudoPublicValue:function () {
                    return this.__privateValue;
                }
            }
        }
    });


    it.should("not return anything if not function is passed in", function (next) {
        comb.executeInOrder().then(function (val) {
            assert.isUndefined(val);
            next();
        }, next);

    });

    it.should("return the return value if no objects are passed in", function (next) {
        comb.executeInOrder(
            function () {
                return "hello world";
            }).then(function (val) {
                assert.equal(val, "hello world");
                next();
            }, next);
    });


    it.should("return the return value with functions that return values", function (next) {
        comb.executeInOrder(staticValueFunction,
            function (staticValueFunction) {
                return staticValueFunction("hello", staticValueFunction("world"));
            }).then(function (val) {
                assert.equal(val, "hello world");
                next();
            }, next);

    });

    it.should("return the return value with functions that return promises", function (next) {
        comb.executeInOrder(promiseValueFunction,
            function (promiseValueFunction) {
                return promiseValueFunction("hello", promiseValueFunction("world"));
            }).then(function (val) {
                assert.equal(val, "hello world");
                next();
            }, next);
    });

    it.should("return the return value with functions that return promises and static values", function (next) {
        comb.executeInOrder(staticValueFunction, promiseValueFunction,
            function (staticValueFunction, promiseValueFunction) {
                return [
                    staticValueFunction("hello", promiseValueFunction("world")),
                    promiseValueFunction("hello1", staticValueFunction("world1")),
                    staticValueFunction("hello2", staticValueFunction("world2")),
                    promiseValueFunction("hello3", promiseValueFunction("world3"))
                ];
            }).then(function (val) {
                assert.deepEqual(val, [
                    "hello world",
                    "hello1 world1",
                    "hello2 world2",
                    "hello3 world3"
                ]);
                next();
            }, next);
    });

    it.should("return the return value with objects that return promises and static values", function (next) {
        comb.executeInOrder(hash,
            function (hash) {
                return [
                    hash.staticValueFunction("hello", hash.promiseValueFunction("world")),
                    hash.promiseValueFunction("hello1", hash.staticValueFunction("world1")),
                    hash.staticValueFunction("hello2", hash.staticValueFunction("world2")),
                    hash.promiseValueFunction("hello3", hash.promiseValueFunction("world3"))
                ];
            }).then(function (val) {
                assert.deepEqual(val, [
                    "hello world",
                    "hello1 world1",
                    "hello2 world2",
                    "hello3 world3"
                ]);
                next();
            }, next);
    });


    it.should("return the return value with with objects class methods", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                return [TestClass.hello(), TestClass.worldPromise()];
            }).then(function (val) {
                assert.deepEqual(val, ["hello", "world"]);
                next();
            }, next);
    });

    it.should("return the return value with with objects instance methods", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                var testClass = new TestClass(1);
                return [testClass.hello(), testClass.worldPromise()];
            }).then(function (val) {
                assert.deepEqual(val, ["hello1", "world1"]);
                next();
            }, next);
    });


    it.should("return the return value with with objects class values", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                var ret = [];
                ret.push(TestClass.publicValue);
                ret.push(TestClass.pseudoPublicValue);
                TestClass.publicValue = "hi!!!";
                ret.push(TestClass.publicValue);
                TestClass.pseudoPublicValue = "hello!!!!";
                ret.push(TestClass.pseudoPublicValue);
                return ret;
            }).then(function (val) {
                assert.deepEqual(val, ["publicValue", "privateValue", "hi!!!", "hello!!!!"]);
                next();
            }, next);
    });

    it.should("return the return value with with objects instance values", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                var ret = [];
                var testClass = new TestClass(1);
                ret.push(testClass.publicValue);
                ret.push(testClass.pseudoPublicValue);
                testClass.publicValue = "hi!!!";
                ret.push(testClass.publicValue);
                testClass.pseudoPublicValue = "hello!!!!";
                ret.push(testClass.pseudoPublicValue);
                return ret;
            }).then(function (val) {
                assert.deepEqual(val, ["publicValue", "privateValue", "hi!!!", "hello!!!!"]);
                next();
            }, next);
    });

    it.should("return the all proxied values if there is no return", function (next) {
        var testClass = new TestClass(1);
        comb.executeInOrder(testClass,
            function (testClass) {
                testClass.publicValue;
                testClass.pseudoPublicValue;
                testClass.publicValue = "hi!!!";
                testClass.pseudoPublicValue = "hello!!!!";
            }).then(function (val) {
                assert.deepEqual(val, ["publicValue", "privateValue", "hi!!!", "hello!!!!"]);
                next();
            }, next);
    });

    it.should("return an array with resolved values", function (next) {
        var testClass = new TestClass(1);
        comb.executeInOrder(testClass,
            function (testClass) {
                var ret = [];
                ret.push(testClass.publicValue);
                ret.push(testClass.pseudoPublicValue);
                testClass.publicValue = "hi!!!";
                ret.push(testClass.publicValue);
                testClass.pseudoPublicValue = "hello!!!!";
                ret.push(testClass.pseudoPublicValue);
                return ret;
            }).then(function (val) {
                assert.deepEqual(val, ["publicValue", "privateValue", "hi!!!", "hello!!!!"]);
                next();
            }, next);
    });

    it.should("return an hash with resolved values", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                var ret = {};
                var testClass = new TestClass(1);
                ret.publicValue = testClass.publicValue;
                ret.psuedoPublicValue = testClass.pseudoPublicValue;
                testClass.publicValue = "hi!!!";
                ret.publicValue2 = testClass.publicValue;
                testClass.pseudoPublicValue = "hello!!!!";
                ret.pseudoPublicValue2 = testClass.pseudoPublicValue;
                return ret;
            }).then(function (val) {
                assert.equal(val.publicValue, "publicValue");
                assert.equal(val.psuedoPublicValue, "privateValue");
                assert.equal(val.publicValue2, "hi!!!");
                assert.equal(val.pseudoPublicValue2, "hello!!!!");
                next();
            }, next);
    });

    it.should("not try to resolve a static value", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                var ret = {};
                var testClass = new TestClass(1);
                ret.publicValue = testClass.publicValue;
                ret.psuedoPublicValue = testClass.pseudoPublicValue;
                testClass.publicValue = "hi!!!";
                ret.publicValue2 = testClass.publicValue;
                testClass.pseudoPublicValue = "hello!!!!";
                ret.pseudoPublicValue2 = testClass.pseudoPublicValue;
                return true;
            }).then(function (val) {
                assert.isTrue(val);
                next();
            }, next);
    });

    it.should("errback if a runtime exception is throws", function (next) {
        comb.executeInOrder(TestClass,
            function (TestClass) {
                var testClass = new TestClass(1);
                return testClass.bye();
            }).then(next, function (val) {
                assert.equal(val.type, "undefined_method");
                next();
            });
    });


    it.should("it should support certain object methods object properties properly", function (next) {
        var x = {hello:"hello", world:"world"};
        comb.executeInOrder(x,
            function (x) {
                delete x.hello;
                return x;
            }).then(function (newX) {
                assert.isUndefined(newX.hello);
                assert.deepEqual(x, newX);
                next();
            }, function (err) {
                assert.equal(err.message, "Cannot delete");
                next();
            })
    });


    it.should("it should throw an error the objects keys", function (next) {
        var x = {hello:"hello", world:"world"};
        var count = 0;
        comb.executeInOrder(x,
            function (x) {
                Object.keys(x);
            }).then(comb.hitch(assert, "fail"), function (err) {
                assert.equal(err.message, "enumerate is not supported");
                count++ != 0 && next();
            });
        comb.executeInOrder(x,
            function (x) {
                Object.keys(x);
            }).then(comb.hitch(assert, "fail"), function (err) {
                assert.equal(err.message, "enumerate is not supported");
                count++ != 0 && next();
            });
    });

}).as(module);


