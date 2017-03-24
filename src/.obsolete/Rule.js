import _ from 'lodash';
import { GraphNode } from './GraphNode';
/**
   Rule description to interface with ReteNEt
   @module Node/Rule
 */
/**
   @constructor
   @alias Node/Rule
   @param name
   @param parent
   @param type
   @param relations
   @param overRideId
*/
let Rule = function(name,parent,type,relations,overRideId){
    GraphNode.call(this,name,parent,"rule",{},overRideId);
};
Rule.prototype = Object.create(GraphNode.prototype);
Rule.constructor = Rule;

export { Rule };

