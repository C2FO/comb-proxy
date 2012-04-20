var comb = require("comb");


comb.deepMerge(exports, require("./proxy"), require("./promise.js"), require("./plugins"));
comb.definePlugin(exports);
module.exports = exports = comb;