if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var Event = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'event',{},overRideId);
        this.linkedNodes[parent.id] = this.linkedNodes[parent.id] + "|" + "parentFSM";
    };
    Event.prototype = Object.create(GraphNode.prototype);
    Event.constructor = Event;

    return Event;
});
