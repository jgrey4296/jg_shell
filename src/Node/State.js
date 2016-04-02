if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var State = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'state',{},overRideId);
        this.linkedNodes.parentFSM = _.keys(this.parents)[0];
        this.linkedNodes.conditions = {};
        //actions to perform on entry?
        this.linkedNodes.actions = {};
        this.linkedNodes.rules = {};
        //events that result in this state:
        this.linkedNodes.inEvents = {};
        //events that are emitted from this state
        this.linkedNodes.outEvents = {};
        
    }
    State.prototype = Object.create(GraphNode.prototype);
    State.constructor = State;
    
    return State;
});
