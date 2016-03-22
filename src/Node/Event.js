if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var Event = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'event',{},overRideId);
        this.parentFSM = null;
        //state PAIRINGS: source -> dest
        this.statePairs = {};
        //Actions to perform with this event
        //will use a manually generated token to fullfill?
        this.conditions = {};
        this.actions = {};
    };
    Event.prototype = Object.create(GraphNode.prototype);
    Event.constructor = Event;

    return Event;
});
