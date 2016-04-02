if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var FSM = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'fsm',{},overRideId);
    };
    FSM.prototype = Object.create(GraphNode.prototype);
    FSM.constructor = FSM;

    
    return FSM;
});
