/**
   The main node type of the graph
   @module Node/GraphNode
   @see GraphNode
*/
import _ from "lodash";
import  util from "../utils";
import  Edge from "../Edge";
import { EdgeData } from "../Commands/CommandStructures";

let nextId = 1;

//TODO: create an edge data structure.
//of form start->edgeData->end


/**
   A node of the overall graph
   @constructor
   @alias GraphNode
*/
export default class GraphNode{
    constructor(name=null,parentId=null,overRideId=null){
        //Note: relationstoCreate = { children: [{name,children,parents}], parents : [{}] }
        name = name || "anon";
        this.id = overRideId || nextId++;
        if (overRideId && overRideId > nextId){
            nextId = overRideId + 1;
        }
        //Map<id,Edge[]>
        this._edges = new Map();
        //Map<id,string|number>
        this._values = new Map();
        //Set<string>
        this._tags = new Set();
        this.minimised = false;
        
        this.tag('graphnode');
        this.setValue('name',name);
        //for root connecting to itself
        if (parentId === -1){
            parentId = this.id;
        }
        if (parentId !== undefined && parentId !== null){
            this.setEdge(parentId,new EdgeData(parentId,
                                               new Set(),
                                               new Map()),
                         new EdgeData(),
                         new EdgeData(this.id,
                                      new Set(),
                                      new Map()));
            this.setValue('_parentId',parentId);
        }
    }
}

GraphNode.prototype.toJSONCompatibleObj = function(){
    let returnObj = {
        id : this.id,
        edges : Array.from(this._edges.values()).map(e=>e.toJSONCompatibleObj()),
        values : Array.from(this._values),
        tags : Array.from(this._tags)
    };
    return returnObj;
};

GraphNode.fromJSON = function(obj){
    let newNode = new GraphNode(null,
                                null,
                                obj.id);
    
    for (let edge of obj.edges){
        let newEdgeData = Edge.fromJSON(edge),
            target = null;
        if (newEdgeData[0].id === obj.id){
            target = newEdgeData[2].id;
        } else {
            target = newEdgeData[0].id;
        }
        newNode.setEdge(target,...newEdgeData);
    }
    newNode._values = new Map(obj.values);
    newNode._tags = new Set(obj.tags);
    return newNode;
};

GraphNode.prototype.getParents = function(){
    let parents = _.filter(Array.from(this._edges.values()),(d)=>d.dest.id===this.id);
    return parents;
};

GraphNode.prototype.getChildren = function(){
    let children = _.filter(Array.from(this._edges.values()),(d)=>d.source.id===this.id);
    return children;
};


GraphNode.prototype.toString = function(){
    return `(${this.id}) : ${this.name._slice(0,10)}`;
};

GraphNode.prototype.setEdge = function(id,sourceData,edgeData,destData){
    //todo: use Edge Data type
    if (sourceData.id === null){
        sourceData.id = this.id;
    } else if (destData.id === null){
        destData.id = this.id;
    }
    if (id !== sourceData.id && id !== destData.id){
        console.log("Inconsistent Edge data:",sourceData,destData);
        throw new Error('Specified an id for an edge that is inconsistent');
    }
    if (this.id !== sourceData.id && this.id !== destData.id){
        console.log('Unconnected Target node:'.sourceData,destData);
        throw new Error('Specified an edge unconnected to the targeted node');
    }
    
    let newEdge = new Edge(sourceData,edgeData,destData);
    this._edges.set(id,newEdge);
    return this;
};

GraphNode.prototype.getEdgeTo = function(id){
    if (id instanceof GraphNode){
        id = id.id;
    }
    if ( !this.hasEdgeWith(id)){
        throw new Error('Node does not have specified edge');
    }
    return this._edges.get(id);
};

GraphNode.prototype.removeEdge = function(id){
    if ( id instanceof GraphNode){
        id = id.id;
    }
    if ( ! this.hasEdgeWith(id)){
        throw new Error("Can't remove an edge that doesn't exist");
    }
    this._edges.delete(id);
    return this;
};

GraphNode.prototype.numOfEdges = function(){
    return this._edges.size;
};


GraphNode.prototype.hasEdgeWith = function(id){
    if (id instanceof GraphNode){
        id = id.id;
    }
    if (this._edges.has(id)){
        return true;
    }
    return false;
};

GraphNode.prototype.name = function(){
    return this.getValue('name');
};

GraphNode.prototype.setName = function(newName){
    this.setValue('name',newName);
    return this;
};

//TODO:
//set values
GraphNode.prototype.setValue = function(key,value){
    if (value !== undefined && value !== null ){
        this._values.set(key,value);
    } else {
        this._values.delete(key);
    }
    return this;
};

GraphNode.prototype.hasValue = function(key){
    return this._values.has(key);
};

GraphNode.prototype.getValue = function(key){
    if (!this._values.has(key)){
        throw new Error("Can't get a value for a non-existent key");
    }
    return this._values.get(key);
};

GraphNode.prototype.values = function(){
    return Array.from(this._values);
};

//set annotations
//set tags
GraphNode.prototype.tags = function(){
    return Array.from(this._tags);
};

GraphNode.prototype.hasTag = function(tag){
    return this._tags.has(tag);
};

GraphNode.prototype.tag = function(tag){
    this._tags.add(tag);
    return this;
};

GraphNode.prototype.tagToggle = function(tag){
    if (this.hasTag(tag)){
        this.untag(tag);
    } else {
        this._tags.add(tag);
    }
    return this;
};

GraphNode.prototype.untag = function(tag){
    this._tags.delete(tag);
    return this;
};

//minimise/uniminimise
