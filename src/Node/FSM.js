if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var FSM = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'fsm',{},overRideId);
        this.linkedNodes.states = {};
        this.linkedNodes.events = {};
        //token generation from values?
    };
    FSM.prototype = Object.create(GraphNode.prototype);
    FSM.constructor = FSM;

    
    return FSM;
});
