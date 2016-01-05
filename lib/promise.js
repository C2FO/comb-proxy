"use strict";
var comb = require("comb"),
    proxy = require("./proxy"),
    hitch = comb.hitch,
    when = comb.when,
    Promise = comb.Promise;

comb.merge(exports, {
    /**
     * @lends comb
     */

    /**
     * This method allows one to code asynchronous code in a synchronous manner.
     *
     * <p>
     *     <b>
     *     Using Object.define[rest of name] on objects passed will result in unexpected behavior.</br>
     *     Enumerating passed in object keys is not currently supported. i.e for in loops on objects.
     *     using array enumeration methods will work though!!
     *     </b>
     * </p>
     *
     * @example
     *
     * var staticValueFunction = function (value) {
     *      return comb.argsToArray(arguments).join(" ");
     * };
     *
     * var promiseValueFunction = function (value) {
     *      var ret = new comb.Promise();
     *      setTimeout(comb.hitch(ret, "callback", comb.argsToArray(arguments).join(" ")), 100);
     *      return ret;
     * };
     *
     * var hash = {
     *      staticValueFunction:staticValueFunction,
     *      promiseValueFunction:promiseValueFunction
     * };
     *
     * var p = comb.executeInOrder(hash, staticValueFunction, promiseValueFunction, function (hash, staticValueFunction, promiseValueFunction) {
     *     var toBe = staticValueFunction(promiseValueFunction("to"), "be");
     *     var notToBe = hash.promiseValueFunction("or", hash.staticValueFunction("not", toBe));
     *     return hash.promiseValueFunction(toBe, notToBe);
     * });
     * p.addCallback(function(ret){
     *     console.log(ret); //=>"to be or not to be"
     * });
     * @param {Object...} args variable number of objects.
     * @param {Function} cb the function to callback to execute in order
     * @returns comb.Promise
     *
     */
    executeInOrder: function (args, cb) {
        args = comb.argsToArray(arguments);
        cb = comb.isFunction(args[args.length - 1]) ? args.pop() : null;
        var ret = new Promise();
        if (cb) {
            var stack = [];
            var newArgs = args.map(function (a) {
                return [a, getHandler(a, stack)];
            });
            var cbRet = cb.apply(null, newArgs.map(function (h) {
                return h[1];
            }));
            executeStack(stack, newArgs).chain(function (results, pMap) {
                if (comb.isUndefined(cbRet)) {
                    ret.callback(results);
                } else {
                    var cbResults;
                    if (comb.isArray(cbRet)) {
                        cbResults = cbRet.map(function (arg) {
                            return getValueFromArrayMap(arg, pMap, newArgs);
                        }).filter(function (r) {
                            return !comb.isUndefined(r);
                        });
                    } else if (comb.isHash(cbRet)) {
                        cbResults = {};
                        for (var i in cbRet) {
                            cbResults[i] = getValueFromArrayMap(cbRet[i], pMap, newArgs);
                        }
                    } else if (comb.isProxy(cbRet)) {
                        cbResults = getValueFromArrayMap(cbRet, pMap, newArgs);
                    } else {
                        cbResults = cbRet;
                    }
                    ret.callback(cbResults);
                }
            }, hitch(ret, "errback"));

        } else {
            ret.callback();
        }
        return ret;
    }
});

function createHandler(obj, stack) {
    return {

        "delete": function (name) {
            stack.push([obj, ["__delete__", [name]], [], obj]);
            return true;
        },
        get: function (receiver, name) {
            var newStack = [],
                handle = getHandler({}, newStack),
                item;
            if (comb.isFunction(obj[name])) {
                handle = proxy.createFunctionWrapper(handle, function (m) {
                    //console.trace(name)
                    var item = [obj, [name], newStack, handle];
                    stack.push(item);
                    //var i = stack[stack.indexOf(item)];
                    var args = comb.argsToArray(arguments);
                    item[1].push(name === "__apply__" || name === "__new__" ? comb.array.flatten(args) : args);
                    return handle;
                });
            } else {
                handle = proxy.createFunctionWrapper(handle, function (m) {
                    //console.trace(name)
                    //var i = stack[stack.indexOf(item)];
                    var args = comb.argsToArray(arguments);
                    item[1].push(name === "__apply__" || name === "__new__" ? comb.array.flatten(args) : args);
                    return handle;
                });
                item = [obj, [name], newStack, handle];
                stack.push(item);
            }
            return handle;
        },
        set: function (receiver, name, val) {
            stack.push([obj, ["__set__", [name, val]], [], obj]);
            return true;
        }, // bad behavior when set fails in non-strict mode
        enumerate: function () {
            stack.push([obj, ["__enumerate__"], [], obj]);
            return [];
        }

    };
}

function functionHandler(handle, stack) {
    var wrapper = proxy.createFunctionWrapper(handle, function (m) {
        return handle.__apply__(comb.argsToArray(arguments));
    }, function () {
        return handle.__new__(comb.argsToArray(arguments));
    });
    return wrapper;
}

function getHandler(obj, stack) {
    var prox = comb.isObject(obj) || comb.isFunction(obj) ? proxy.handlerProxy({}, createHandler(obj, stack)) : obj, ret;
    if (comb.isFunction(obj)) {
        return functionHandler(prox, stack);
    } else {
        ret = prox;
    }
    return ret;
}

function getValueFromArrayMap(arg, pMap, handles) {
    var result;
    if (proxy.isProxy(arg)) {
        var results = pMap.filter(function (p) {
            return p[0] === arg;
        });

        if (results.length) {
            result = results[0][1];
        } else {
            !results.length && (results = handles.filter(function (h) {
                return h[1] === arg;
            }));

            if (results.length) {
                result = results[0][0];
            }
        }
    } else if (comb.isHash(arg) || comb.isArray(arg)) {
        for (var i in arg) {
            var a = arg[i];
            arg[i] = getValueFromArrayMap(a, pMap, handles);
        }
        result = arg;
    } else {
        result = arg;
    }
    return result;
}

function executeStack(stack, handles, pMap) {
    var ret = new Promise(), l = stack.length, results = [];
    pMap = pMap || [];
    var errored = false;
    if (l) {
        (function exec(i) {
            if (i < l) {
                var curr = stack[i],
                    obj = getValueFromArrayMap(curr[0], pMap, handles),
                    m = curr[1],
                    name = m[0],
                    args = m[1],
                    subStack = curr[2],
                    handle = curr[3];
                var p;
                try {
                    if (name === "__set__") {
                        p = (obj[args[0]] = getValueFromArrayMap(args[1], pMap, handles));
                    } else if (name === "__delete__") {
                        p = delete obj[args[0]];
                    } else if (name === "__keys__" || name === "__enumerate__") {
                        throw new Error(name.replace(/^__|__$/g, "") + " is not supported");
                    } else if (name === "__apply__") {
                        p = (obj.apply(obj, getValueFromArrayMap(args, pMap, handles)));
                    } else if (name === "__new__") {
                        try {
                            /*jshint -W055*/
                            p = new obj();
                        } catch (ignore) {
                        }
                        obj.apply(p, getValueFromArrayMap(args, pMap, handles));
                    } else if (comb.isUndefined(args)) {
                        p = obj[name];
                    } else {
                        var f;
                        if (!comb.isUndefined((f = obj[name])) && comb.isFunction(f)) {
                            p = f.apply(obj, args.map(function (arg) {
                                var ret = getValueFromArrayMap(arg, pMap, handles);
                                return ret;
                            }));
                        } else {
                            //Purposely call to throw an ERROR!!!!
                            obj[name]();
                        }
                    }
                } catch (e) {
                    errored = true;
                    return ret.errback(e);
                }
                when(p)
                    .chain(function (res) {
                        if (subStack.length) {
                            subStack.forEach(function (ss) {
                                ss[0] = res;
                            });
                            return executeStack(subStack, handles, pMap).chain(function (sres) {
                                pMap.push([handle, res]);
                                results.push(sres);
                            });
                        } else {
                            pMap.push([handle, res]);
                            results.push(res);
                        }
                    })
                    .chain(function () {
                        !errored && exec(++i);
                    }, ret.errback);
            } else {
                !errored && ret.callback(results, pMap);
            }
        }(0));
    } else {
        ret.callback(results, pMap);
    }
    return ret;
}

