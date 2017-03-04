import _ from 'lodash';
import { GraphNode } from './GraphNode';

let State = function(name,parent,type,relations,overRideId){
    GraphNode.call(this,name,parent,'state',{},overRideId);
    //this.linkedNodes[parent.id] = this.linkedNodes[parent.id] + "|" + "parentFSM";
};

State.prototype = Object.create(GraphNode.prototype);
State.constructor = State;

export { State };

