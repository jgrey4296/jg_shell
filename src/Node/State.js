if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var State = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'state',{},overRideId);
        this.parentFSM = null;
        this.conditions = {};
        //actions to perform on entry?
        this.actions = {};
        this.rules = {};
        this.events = {};
        
    }
    State.prototype = Object.create(GraphNode.prototype);
    State.constructor = State;
    
    return State;
});
