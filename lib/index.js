"use strict";
var comb = require("comb");

/**
 * @projectName comb-proxy
 * @github https://github.com/c2fo/comb-proxy
 *
 * @header
 * <h1>comb-proxy</h1>
 *
 * <h2>Overview</h2>
 * <p>
 *      Comb-proxy is plugin for comb to expose ProxyHelpers.
 * </p>
 *
 * <h2> Installation</h2>
 *
 * {@code npm install comb-proxy}
 *
 *
 * <h2>Usage</h2>
 *
 * To initialize comb-proxy simply require it.
 *
 * {@code
 * var comb = require("comb-proxy");
 * }
 *
 *
 * @footer
 *
 * <h2>License</h2>
 *
 * <p>MIT <a href = https://github.com/c2fo/comb-proxy/raw/master/LICENSE>LICENSE</a><p>
 *
 * <h2>Meta</h2>
 * <hr>
 * <p>Code: <code>git clone git://github.com/c2fo/comb-proxy.git</code></br></p>
 */

/**
 * @namespace Alias for comb.
 * @name comb
 */
comb.deepMerge(exports, require("./proxy"), require("./promise.js"), require("./plugins"));
comb.definePlugin(exports);
module.exports = exports = comb;