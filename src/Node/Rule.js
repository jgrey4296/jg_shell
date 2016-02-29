if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

/**
   Rule description to interface with ReteNEt
   @module Node/Rule
 */
define(['underscore','./GraphNode'],function(_,GraphNode){
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
        //id -> name of condition objects
        this.conditions = {};
        //id -> name of action objects
        this.actions = {};
    };
    Rule.prototype = Object.create(GraphNode.prototype);
    Rule.constructor = Rule;
    
    return Rule;
});
