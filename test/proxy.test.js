"use strict";
var it = require('it'),
    assert = require('assert'),
    comb = require("index");

it.describe("Proxy utilities", function (it) {

//create an object that can use properties or as a function through the new operator
    var MyObject = comb.define(null, {
        instance:{
            hello:"hello",
            constructor:function () {
                this.args = comb.argsToArray(arguments);
            }
        }
    });

//NOTE: this will not work properly for native objects like Date.
    var createNewMyObject = function () {
        try {
            var p = new MyObject();
        } catch (ignore) {
            //ignore the error because its probably from missing arguments
        }
        //Now lets take care of arguments supplied!!!
        MyObject.apply(p, comb.array.flatten(["called by function wrapper"], comb.argsToArray(arguments)));
        return p;
    };

    var staticValue = function (value) {
        return value;
    };


    it.describe("a function handler", function (it) {
        it.should("create one for just function calls", function () {
            //This example is redundant but its just as example :)
            var o = {world:"world"};
            var handle = comb.createFunctionWrapper(o, createNewMyObject);
            assert.equal(handle.world, "world");
            var a = handle(1);
            assert.equal(a.hello, "hello");  //=>"hello"
            assert.deepEqual(a.args, ["called by function wrapper", 1]); //=> [1];
            a = new handle(1, 2);
            assert.equal(a.hello, "hello");  //=>"hello"
            assert.deepEqual(a.args, ["called by function wrapper", 1, 2]); //=> [1];
        });

        it.should("create one for just function and constructor calls", function () {
            //This example is redundant but its just as example :)
            var o = {world:"world"};
            var handle = comb.createFunctionWrapper(o, staticValue, createNewMyObject);
            assert.equal(handle.world, "world");
            var a = handle(1);
            assert.equal(a, 1);
            assert.isUndefined(a.args);
            a = new handle(1, 2);
            assert.equal(a.hello, "hello");
            assert.deepEqual(a.args, ["called by function wrapper", 1, 2]);
        });

        it.should("create resolve arguments properly", function () {
            //This example is redundant but its just as example :)
            var o = {world:"world"};
            var handle = comb.createFunctionWrapper(o, null, createNewMyObject);
            assert.equal(handle.world, "world");
            var a = handle(1);
            assert.equal(a.hello, "hello");  //=>"hello"
            assert.deepEqual(a.args, ["called by function wrapper", 1]); //=> [1];
            a = new handle(1, 2);
            assert.equal(a.hello, "hello");  //=>"hello"
            assert.deepEqual(a.args, ["called by function wrapper", 1, 2]); //=> [1];
        });

        it.should("accept a prototype argument create resolve arguments properly", function () {
            //This example is redundant but its just as example :)
            var o = {};
            var handle = comb.createFunctionWrapper(o, null, createNewMyObject, MyObject);
            assert.instanceOf(handle, MyObject);
            assert.isUndefined(handle.world);
            var a = handle(1);
            assert.equal(a.hello, "hello");  //=>"hello"
            assert.deepEqual(a.args, ["called by function wrapper", 1]); //=> [1];
            a = new handle(1, 2);
            assert.equal(a.hello, "hello");  //=>"hello"
            assert.deepEqual(a.args, ["called by function wrapper", 1, 2]); //=> [1];
        });

    });

    it.describe("comb#methodMissing", function(it){
        it.should("handle method missing calls ", function () {
            var x = {hello:function () {
                return "hello"
            }, world:"world"};
            var xHandler = comb.methodMissing(x, function (m) {
                return function () {
                    return [m].concat(comb.argsToArray(arguments));
                }
            });
            assert.equal(xHandler.hello(), "hello");
            assert.equal(xHandler.world, "world");
            assert.deepEqual(xHandler.someMethod("hello", "world"), [ 'someMethod', 'hello', 'world' ]);
        });

        it.should(" handle method missing calls with a defined proto ", function () {
            var xHandler = comb.methodMissing(MyObject, function (m) {
                return function () {
                    return [m].concat(comb.argsToArray(arguments));
                }
            }, MyObject);
            assert.instanceOf(xHandler, MyObject);
            assert.equal(xHandler.hello(), "hello");
            assert.equal(xHandler.world(), "world");
            assert.deepEqual(xHandler.someMethod("hello", "world"), [ 'someMethod', 'hello', 'world' ]);
        });

    });

}).as(module);

