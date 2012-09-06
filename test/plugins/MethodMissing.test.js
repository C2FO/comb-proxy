"use strict";
var it = require('it'),
    assert = require('assert'),
    comb = require("index"),
    define = comb.define,
    hitch = comb.hitch;

it.describe("comb.plugins.MethodMissing", function (it) {
//Super of other classes
    var Missing = define(comb.plugins.MethodMissing, {
        instance:{

            constructor:function (options) {
                this._super(arguments);
                this._attributes = {};
            },

            instanceMethod:function (val, force) {
                if (force) {
                    this.randomValue = val;
                    return this;
                } else {
                    return this.instanceMethod(val, true);
                }
            },

            setMissingProperty:function (name, val) {
                this._attributes[name] = val;
            },

            getMissingProperty:function (name) {
                return this._attributes[name];
            }
        }
    });

    var MissingInherit = define(Missing);

    var o = new comb.plugins.MethodMissing();

    var missing = new Missing();


    it.should("use default JS behavior of the methods are not overridden ", function () {
        //This is true because they inherit from eachother!
        assert.isUndefined(o.name);
        o.name = "hello";
        assert.equal(o.name, "hello");
        assert.throws(function () {
            o.random();
        });
    });


    it.should("maintain type", function () {
        assert.instanceOf(missing, Missing);
        assert.instanceOf(missing, comb.plugins.MethodMissing);
        var inherit = new MissingInherit();
        assert.instanceOf(inherit, MissingInherit);
        assert.instanceOf(inherit, Missing);
        assert.instanceOf(inherit, comb.plugins.MethodMissing);

    });

    it.should("call the setPropertiesMethod when setting a property", function () {
        //This is true because they inherit from eachother!
        missing.name = "hello";
        assert.equal(missing._attributes.name, "hello");
    });

    it.should("call the getPropertiesMethod when setting a property", function () {
        //This is true because they inherit from eachother!
        o.name = "hello";
        assert.equal(missing.name, "hello");
    });

    it.should("allow the calling of functions", function () {
        //This is true because they inherit from eachother!
        missing.instanceMethod("comb is awesome!");
        assert.equal(missing.randomValue, "comb is awesome!");
    });

}).as(module);

