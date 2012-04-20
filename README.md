comb-proxy
==========

Overview
--------

Plugin for comb to expose ProxyHelpers.

## Installation

    npm install comb-proxy
    
    
##Usage
    
To initialize comb-proxy simply require it.
    
```javascript
   
   var comb = require("comb-proxy");
    
```

###comb Proxy helper functions

comb-proxy adds serveral methods to ease the use of the Proxy API

 * comb.handlerProxy(obj, prox, proto?) : creates a simple proxy around an object
 * comb.methodMissing(obj, handler, proto?) : creates a method/propery missing wrapper
 

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

  * comb.isProxy(obj) : tests if something is a proxy
  * comb.createFunctionWrapper(obj, handler, constructTrap, proto) : creates a function wrapper around an object


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
                                        
  

###comb.executeInOrder

Comb Proxy adds a method called comb.executeInOrder which allows you to write async code in a synchronous manner using proxies.

```javascript
var comb = require("comb-proxy");

//create a funciton that executes synchronously
var staticValueFunction = function (value) {                                                                                                  
     return comb.argsToArray(arguments).join(" ");                                                                                            
};                                                                                                                                            
                 
//an async version of the same code                 
var promiseValueFunction = function (value) {                                                                                                 
     var ret = new comb.Promise();                                                                                                            
     setTimeout(comb.hitch(ret, "callback", comb.argsToArray(arguments).join(" ")), 100);                                                     
     return ret;                                                                                                                              
};                                                                                                                                            
        
//You can also pass in objects to execute in order
var hash = {                                                                                                                                  
     staticValueFunction:staticValueFunction,                                                                                                 
     promiseValueFunction:promiseValueFunction                                                                                                
};                                                                                                                                            
      
//Pass in each function/object you wish to proxy      
var p = comb.executeInOrder(hash, staticValueFunction, promiseValueFunction, function (hash, staticValueFunction, promiseValueFunction) {     
    //in here you can just use the methods as if they were synchronous
    var toBe = staticValueFunction(promiseValueFunction("to"), "be");                                                                         
    var notToBe = hash.promiseValueFunction("or", hash.staticValueFunction("not", toBe));                                                     
    return hash.promiseValueFunction(toBe, notToBe);                                                                                          
}); 
//listen for the results
p.addCallback(function(ret){                                                                                                                  
    console.log(ret); //=>"to be or not to be"                                                                                                
});                                                                                                                                           
```

###comb.plugins.MethodMissing

comb-proxy also adds a MethodMissing plugin to be used with objects to similate method missing calls.

```javascript
var comb = require("comb-proxy")

//Example use with a builder
var Builder = comb.define(comb.plugins.MethodMissing, {

    instance:{

        __WITH_REGEX:/^with(\w+)/,

        __GET_REGEX:/^get(\w+)(\d+)/,

        _attributes:null,

        constructor:function () {
            this._super(arguments);
            this._attributes = {};
        },


        getMissingProperty:function (name) {
            var match = name.match(this.__GET_REGEX);            
            if (match != null) {
                //if it starts with get and ends with an integer
                //then we'll assume you are looking for a subbuilder
                var prop = match[1];
                return this["_" + prop.charAt(0).toLowerCase() + prop.substr(1) + "s"][parseInt(match[2], 10) - 1];
            } else if((match = name.match(this.__WITH_REGEX)) != null){
                //setting an attribute
                var prop = match[1];
                return comb.hitch(this, function(val){
                    this._attributes[prop.charAt(0).toLowerCase() + prop.substr(1)] = val;
                    return this;
                });
            } else {
                return this._super(arguments);
            }
        }
    },

    static:{
        create:function () {
          //return a new instance of this
            return new this();
        }
    }
});  

var PostBuilder = comb.define(Builder, {
     instance : {
       constructor : function(title, text, date){
          this._super(arguments);          
          this._attributes = {
            title : title || "",
            text : text || "",
            date : date || null
          }
       }             
     }          
});

var BlogBuilder = comb.define(Builder, {
  instance : {
       constructor : function(){
          this._super(arguments);          
          this._posts = [];
          this._attributes = {
            title : ""
          }
       },
       
       //add a method for adding new posts
       withPost : function(post){
          this._posts.push(post);
       }
     },
     
     static : {              
       
       //a helper to create a new builder with a post
       createWithPost : function(blogTitle, title, text, date){
         return this.create()
                      .withTitle(blogTitle)
                      .withPost(PostBuilder.create()
                                            .withTitle(title)
                                            .withText(text)
                                            .withDate(date));
       }
     }
});

//create a new blog
var blogBuilder = BlogBuilder.create("MyBlog", "Post1", "Hello Word", Date.now());
//acces post with dynamic getter
var postBuilder = blogBuilder.getPostBuilder1.withTitle("Changed Title");

```


License
-------

MIT <https://github.com/Pollenware/comb/raw/master/LICENSE>

Meta
----

* Code: `git clone git://github.com/pollenware/comb-proxy.git`
* JsDoc: <http://pollenware.github.com/comb-proxy>
* Website:  <http://pollenware.com> - Twitter: <http://twitter.com/pollenware> - 877.465.4045