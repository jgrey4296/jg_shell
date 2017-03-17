/**
   The main node type of the graph
   @module Node/GraphNode
   @see GraphNode
*/
import _ from 'lodash';
import { util } from '../utils';

let nextId = 0;

//TODO: create an edge data structure.
//of form start->edgeData->end


/**
   A node of the overall graph
   @constructor
   @alias GraphNode
*/
class GraphNode{
    constructor(name,parentId,type,relationsToCreate,overRideId){
        //Note: relationstoCreate = { children: [{name,children,parents}], parents : [{}] }
        
        this.id = overRideId || nextId++;
        if (overRideId && overRideId > nextId){
            nextId = overRideId + 1;
        }
        this._name = name || 'anon';
        this.relatedObjects = [];
        //Map<id,edge[]>
        this._edges = new Map();
        //Map<str,id>
        this._edges_by_name = new Map();
        this.parentId = parentId
        this._values = new Map();
        this._annotations = new Map();
        this._tags = new Set();
        this.minimised = false;

        
        this._tags.add(type || 'graphnode');

        /*
          r = [
          {name, type, relType,recType, subRelations : [<r>]}
          ]
        */
        if (relationsToCreate !== undefined && relationsToCreate instanceof Array){
            this.relatedObjects = relationsToCreate;
        }
        
    }
}
GraphNode.constructor = GraphNode;

GraphNode.prototype.toString = function(){
    return `(${this.id}) : ${this.name._slice(0,10)}`;
};

GraphNode.prototype.setEdge = function(id,edgeType){
    if (id instanceof GraphNode){
        id = id.id;
    }
    if(edgeType === undefined){
        throw new Error('Edgetype undefined');
    }
    this._edges.set(id,edgeType);
    return this;
};

GraphNode.prototype.getEdgeTo = function(id){
    if (id instanceof GraphNode){
        id = id.id;
    }
    if ( !this.hasEdgeTo(id)){
        throw new Error('Node does not have specified edge');
    }
    return this._edges.get(id);
}

GraphNode.prototype.removeEdge = function(id){
    if ( id instanceof GraphNode){
        id = id.id;
    }
    if ( ! this.hasEdgeTo(id)){
        throw new Error("Can't remove an edge that doesn't exist");
    }
    this._edges.delete(id);
    return this;
}

GraphNode.prototype.numOfEdges = function(){
    return this._edges.size;
};


GraphNode.prototype.hasEdgeTo = function(id){
    if (id instanceof GraphNode){
        id = id.id;
    }
    if (this._edges.has(id)){
        return true;
    }
    return false;
}

GraphNode.prototype.name = function(){
    return this._name;
}

GraphNode.prototype.setName = function(newName){
    this._name = newName;
    return this;
}

//TODO:
//set values
GraphNode.prototype.setValue = function(key,value){
    if (value !== undefined ){
        this._values.set(key,value);
    }else{
        this._values.delete(key);
    }
    return this;
}

GraphNode.prototype.getValue = function(key){
    if(!this._values.has(key)){
        throw new Error("Can't get a value for a non-existent key");
    }
    return this._values.get(key);
}

GraphNode.prototype.values = function(){
    return Array.from(this._values.keys());
}

//set annotations
//set tags
GraphNode.prototype.tags = function(){
    return Array.from(this._tags);
}

GraphNode.prototype.hasTag = function(tag){
    return this._tags.has(tag);
}

GraphNode.prototype.tag = function(tag){
    this._tags.add(tag);
    return this;
}

GraphNode.prototype.tagToggle = function(tag){
    if (this.hasTag(tag)){
        this.untag(tag);
    }else{
        this._tags.add(tag);
    }
    return this;
}

GraphNode.prototype.untag = function(tag){
    this._tags.delete(tag);
    return this;
}

//minimise/uniminimise

export { GraphNode };

