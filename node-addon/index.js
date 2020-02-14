console.log('hello, node')

var addon = require('./build/Release/addon.node');
console.log(addon.hello());

var democpp=require("./build/Release/democpp.node")
console.log(democpp.hello());

console.log(democpp.md5("abc"))