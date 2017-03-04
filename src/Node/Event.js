import _ from 'lodash';
import { GraphNode } from './GraphNode';


let Event = function(name,parent,type,relations,overRideId){
    GraphNode.call(this,name,parent,'event',{},overRideId);
    //this.linkedNodes[parent.id] = this.linkedNodes[parent.id] + "|" + "parentFSM";
    
    
};
Event.prototype = Object.create(GraphNode.prototype);
Event.constructor = Event;

export { Event };

