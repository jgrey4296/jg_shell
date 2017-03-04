import _ from 'lodash';
import { GraphNode } from './GraphNode';

/**
   A root FSM object. Tracks states and events,
   stores node -> state pairings for the fsm runtime.
   @see module:Shell_fsm
*/
let FSM = function(name,parent,type,relations,overRideId){
    GraphNode.call(this,name,parent,'fsm',{},overRideId);
    //individualId -> current stateId pairing
    //individualId -> Rete Token?
    this.instanceStates = {};
    
};
FSM.prototype = Object.create(GraphNode.prototype);
FSM.constructor = FSM;

FSM.prototype.getDescriptionObjects = function(){
    let descriptionObjects = this.getDescriptionObjectsBase();
    descriptionObjects.push({
        name : "Currently Utilized By:",
        values : _.toPairs(this.positions).map(d=>d.join(" : "))
    });
    return descriptionObjects;
};

export { FSM };

