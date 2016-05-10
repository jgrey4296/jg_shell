if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['lodash','./GraphNode'],function(_,GraphNode){

    var State = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'state',{},overRideId);
        //this.linkedNodes[parent.id] = this.linkedNodes[parent.id] + "|" + "parentFSM";
    }
    State.prototype = Object.create(GraphNode.prototype);
    State.constructor = State;
    
    return State;
});
