<a name="top"></a>


  <h1>comb-proxy</h1>

<h2>Overview</h2>
<p>
     Comb-proxy is plugin for comb to expose ProxyHelpers.
</p>

<h2> Installation</h2>

```javascript
 npm install comb-proxy
```


<h2>Usage</h2>

To initialize comb-proxy simply require it.

```javascript

var comb = require("comb-proxy");

```

##Namespaces



  * [comb](#comb)



##Classes



  * [comb.plugins.MethodMissing](#comb_plugins_MethodMissing)


<a name="comb"></a>
##comb

[Top](#top)


Alias for comb.


  * [createFunctionWrapper](#comb_createFunctionWrapper)

  * [executeInOrder](#comb_executeInOrder)

  * [handlerProxy](#comb_handlerProxy)

  * [isProxy](#comb_isProxy)

  * [methodMissing](#comb_methodMissing)


  
<a name="comb_createFunctionWrapper"></a>
###createFunctionWrapper
 _static_  function public


---
*Defined proxy.js* [Top](#top)


Creates a function proxy for an object.


        
*Example*

```javascript
//create an object that can use properties or as a function through the new operator
var MyObject = comb.define(null, {
    instance : {
        hello : "hello",
        constructor : function(){
            this.args = comb.argsToArray(arguments);
        }
    }
});

//NOTE: this will not work properly for native objects like Date.
var createNewMyObject = function(){
   try {
     p = new MyObject();
    } catch (ignore) {
         //ignore the error because its probably from missing arguments
    }
    //Now lets take care of arguments supplied!!!
    MyObject.apply(p, comb.argsToArray(arguments));
    return p;
};

//This example creates an object with a world property but its not a function!
var handle = comb.createFunctionWrapper({world : "world"}, createNewMyObject, createNewMyObject);

handle.world //=> "world"
var a = handle(1);
a.hello;  //=>"hello"
a.args; //=> [1];
a = new handle(1,2);
a.hello; //=>"hello"
a.args; //=> [1,2];
```

     
*Arguments*

        
 * _obj_  : the object to proxy
        
 * _handler_  : the handler to call when the object is used as a function
        
 * _constructTrap_  : the funciton to use when using new on the object
        
 * _opts_  : the prototype of the object.
        
     
     


    
*Source*

```javascript
function (obj,handler,constructTrap,opts){
   var args = comb.argsToArray(arguments), ret;
   if (args.length != 4) {
       opts = comb.isHash(args[args.length - 1]) ? args.pop() : null;
       constructTrap = comb.isFunction(args[args.length - 1]) ? args.pop() : null;
       handler = comb.isFunction(args[args.length - 1]) ? args.pop() : null;
   }
   if (comb.isUndefined(obj)) throw new Error("obj required when using create function wrapper");
   if (comb.isFunction(constructTrap) && !comb.isFunction(handler)) {
       ret = Proxy.createFunction(handlerMaker(obj), constructTrap);
   } else {
       ret = Proxy.createFunction(handlerMaker(obj), handler, constructTrap);
   }
   if (opts) {
       Proxy.setPrototype(ret, comb.isHash(opts) ? opts : opts.prototype);
   }
   return ret;
}
```
    
    
  
<a name="comb_executeInOrder"></a>
###executeInOrder
 _static_  function public


---
*Defined promise.js* [Top](#top)


This method allows one to code asynchronous code in a synchronous manner.

<p>
    <b>
    Using Object.define[rest of name] on objects passed will result in unexpected behavior.</br>
    Enumerating passed in object keys is not currently supported. i.e for in loops on objects.
    using array enumeration methods will work though!!
    </b>
</p>


        
*Example*

```javascript
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

var p = comb.executeInOrder(hash, staticValueFunction, promiseValueFunction, function (hash, staticValueFunction, promiseValueFunction) {
    var toBe = staticValueFunction(promiseValueFunction("to"), "be");
    var notToBe = hash.promiseValueFunction("or", hash.staticValueFunction("not", toBe));
    return hash.promiseValueFunction(toBe, notToBe);
});
p.addCallback(function(ret){
    console.log(ret); //=>"to be or not to be"
});
```

     
*Arguments*

        
 * _args_  : variable number of objects.
        
 * _cb_  : the function to callback to execute in order
        
     
     
*Returns*
        
 *  comb.Promise
        
     


    
*Source*

```javascript
function (args,cb){
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
       executeStack(stack, newArgs).then(function (results, pMap) {
           if (comb.isUndefined(cbRet)) {
               ret.callback(results);
           }
           else {
               var cbResults;
               if (comb.isArray(cbRet)) {
                   cbResults = cbRet.map(
                       function (arg) {
                           return getValueFromArrayMap(arg, pMap, newArgs);
                       }).filter(function (r) {
                           return !comb.isUndefined(r)
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
```
    
    
  
<a name="comb_handlerProxy"></a>
###handlerProxy
 _static_  function public


---
*Defined proxy.js* [Top](#top)


Creates a proxy for an object.

        
     
*Arguments*

        
 * _obj_  : object to proxy
        
 * _opts_  : object with methods to define on the handler.
        
 * _proto_  : 
        
     
     


    
*Source*

```javascript
function (obj,opts,proto){
   opts = opts || {};
   if (comb.isUndefined(proto)) {
       return  Proxy.create(merge(handlerMaker(obj), opts));
   } else {
       return  Proxy.create(merge(handlerMaker(obj), opts), comb.isHash(proto) ? proto : proto.prototype);
   }
}
```
    
    
  
<a name="comb_isProxy"></a>
###isProxy
 _static_  function public


---
*Defined proxy.js* [Top](#top)


 Determines if the object is a proxy or not.


        
     
*Arguments*

        
 * _obj_  : object to test
        
     
     
*Returns*
        
 * <code>Boolean</code> true if it is a proxy false otherwise
        
     


    
*Source*

```javascript
function (obj){
   var undef;
   return obj !== undef && obj !== null && Proxy.isProxy(obj);
}
```
    
    
  
<a name="comb_methodMissing"></a>
###methodMissing
 _static_  function public


---
*Defined proxy.js* [Top](#top)


Creates a method missing proxy for an object.
<b>NOTE:</b> This method does not gurantee that the property will be used as a function call.


        
*Example*

```javascript
var x = {hello:function () {return "hello"}, world:"world"};
 var xHandler = comb.methodMissing(x, function (m) {
             //you can do more interesting stuff in here!
              return function () {
                  return [m].concat(comb.argsToArray(arguments));
              }
  });
 xHandler.hello(); //=> "hello"
 xHandler.world //=> "world"
 xHandler.someMethod("hello", "world"); //=> [ 'someMethod', 'hello', 'world' ]
```

     
*Arguments*

        
 * _obj_  : object to wrap with a method missing proxy
        
 * _handler_  : handle to call when a property is missing
        
 * _proto_  : 
        
 * _opts_ <code>Object</code> : prototype to assign to the proxy
        
     
     
*Returns*
        
 * <code>Proxy</code> a proxy
        
     


    
*Source*

```javascript
function (obj,handler,proto){
   proto = proto || {};
   return  Proxy.create(merge(handlerMaker(obj), noSuchMethodHandler(obj, handler)), comb.isHash(proto) ? proto : proto.prototype);
}
```
    
    
  



<a name="comb_plugins_MethodMissing"></a>
##comb.plugins.MethodMissing

[Top](#top)


This plugin exposes two instance properties:
<ul>
    <li><b>getMissingProperty</b> method called when a property is being retrieved and is not found on the current instance</li>
    <li><b>setMissingProperty</b> method called when a property is being set and the property is not found on the current instance</li>
</ul>

        
*Example*

```javascript
var MyClass = comb.define(comb.plugins.MethodMissing, {
    instance : {

        constructor : function(){
             this._attributes = {};
        },

        getMissingProperty : function(name){
            return this._attributes[name];
        },

        setMissingProperty : function(name, value){
            return this._attributes[name] = value;
        }
    }
});
```










*Instance*

  * [getMissingProperty](#comb_plugins_MethodMissing_prototype_getMissingProperty)

  * [setMissingProperty](#comb_plugins_MethodMissing_prototype_setMissingProperty)


###Constructor

*Defined plugins/MethodMissing.js* [Top](#top)
     



  
  
<a name="comb_plugins_MethodMissing_prototype_getMissingProperty"></a>
###getMissingProperty
 function public


---
*Defined plugins/MethodMissing.js* [Top](#top)


Method called to retrieve a property that is not found on the current instance of the object

        
     
*Arguments*

        
 * _name_  : the name of the property to retrieve.
        
     
     


    
*Source*

```javascript
function (name){
   //return defaults
   return undefined;
           
}
```
    
    
  
<a name="comb_plugins_MethodMissing_prototype_setMissingProperty"></a>
###setMissingProperty
 function public


---
*Defined plugins/MethodMissing.js* [Top](#top)


Method called to set a property that is not found on the current instance of the object

        
     
*Arguments*

        
 * _name_  : the name of the property to set.
        
 * _value_  : the value to set the property to.
        
     
     


    
*Source*

```javascript
function (name,value){
   //return defaults
   return this[name] = value;
           
}
```
    
    
  


  <h2>License</h2>

<p>MIT <a href = https://github.com/c2fo/comb-proxy/raw/master/LICENSE>LICENSE</a><p>

<h2>Meta</h2>
<hr>
<p>Code: <code>git clone git://github.com/c2fo/comb-proxy.git</code></br></p>



