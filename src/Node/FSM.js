if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){
    "use strict";
    
    var FSM = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,'fsm',{},overRideId);
        this.positions = {};
        
    };
    FSM.prototype = Object.create(GraphNode.prototype);
    FSM.constructor = FSM;

    FSM.prototype.getDescriptionObjects = function(){
        let descriptionObjects = this.getDescriptionObjectsBase();
        descriptionObjects.push({
            name : "Currently Utilized By:",
            values : _.pairs(this.positions).map(d=>d.join(" : "))
        });
        return descriptionObjects;
    };
    
    return FSM;
});
