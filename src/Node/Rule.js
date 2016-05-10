if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

/**
   Rule description to interface with ReteNEt
   @module Node/Rule
 */
define(['lodash','./GraphNode'],function(_,GraphNode){
    "use strict";
    /**
       @constructor
       @alias Node/Rule
       @param name
       @param parent
       @param type
       @param relations
       @param overRideId
     */
    var Rule = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,"rule",{},overRideId);
    };
    Rule.prototype = Object.create(GraphNode.prototype);
    Rule.constructor = Rule;

    return Rule;
});
