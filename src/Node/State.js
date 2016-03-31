if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var State = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'state',{},overRideId);
        this.parentFSM = _.keys(this.parents)[0];
        this.conditions = {};
        //actions to perform on entry?
        this.actions = {};
        this.rules = {};
        //events that result in this state:
        this.inEvents = {};
        //events that are emitted from this state
        this.outEvents = {};
        
    }
    State.prototype = Object.create(GraphNode.prototype);
    State.constructor = State;
    
    return State;
});
