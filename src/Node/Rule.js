if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

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
