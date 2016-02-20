/**
   @file GraphNode
   @purpose To define the base data structure for the shell
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var nextId = 0;
    //The main node type of the graph:
    //Note: relationstoCreate = { children: [{name,children,parents}], parents : [{}] }
    var GraphNode = function(name,parent,type,relationsToCreate,overRideId){
        //Id and name for identification
        this.id = overRideId || nextId++;
        if(overRideId && overRideId > nextId){
            nextId = overRideId + 1;
        }
        
        this.name = name;

        //Parents and children created internally, ready to be sent to the shell for registration
        this.relatedObjects = [];

        //parents and children for links
        //storing by ID
        //Note: converted to *only* store id's, and not the objects
        //therefore no cycles, therefore json export
        this.children = {};
        this.parents = {};
        if(parent !== undefined){
            this._originalParent = parent.id;
            this.parents[parent.id] = parent.name;
        }

        //Data stored in the node
        this.values = {};
        this.tags = {};
        this.annotations = {};

        //Used to update the prototype on json-imported data
        this.tags.type = type || 'graphnode';

        //**Relations to rules:
        //Rules that consume this fact:
        this.expectedBy = {};
        //Rules that produce this fact:
        this.producedBy = {};


        //Create the relations passed in:
        //Each entry in the list: L = { name: "", children : [L], parents : [L] }
        if(relationsToCreate !== undefined && relationsToCreate.children !== undefined){
            relationsToCreate.children.forEach(function(d){
                var relations = {
                    children : d.children,
                    parents : d.parents,
                },
                    subName = d.name || d;
                this.addRelation('child',new GraphNode(subName,this,undefined,relations));
            },this);
        }

        if(relationsToCreate !== undefined && relationsToCreate.parents !== undefined){
            relationsToCreate.parents.forEach(function(d){
                var relations = {
                    children : d.children,
                    parents : d.parents,
                },
                    subName = d.name || d;
                this.addRelation('parent',new GraphNode(subName,this,undefined,relations));
            },this);

        }


        
    };
    GraphNode.constructor = GraphNode;

    GraphNode.prototype.toString = function(){
        return `(${this.id}) : ${this.name}`;
    };

    GraphNode.prototype.setValue = function(value,field,parameter){
        //todo: add guards so you don't delete something important like 'id'
        if(parameter !== undefined){ //set this[field][parameter] -> value
            if(this[field] === undefined){ //create field if missing
                this[field] = {};//as an object because theres a parameter
            }
            if(value !== undefined){//if value exists set it
                this[field][parameter] = value;
            }else{//otherwise remove the memory location
                delete this[field][parameter];
            }
        }else{//parameter not specified, value is a scalar not object param
            if(value !== undefined){//if value exists, set it
                this[field] = value;
            }else{
                delete this[field];//value isnt specified, remove.
            }
        }
    };

    GraphNode.prototype.addRelation = function(target,object){
        this.relatedObjects.push(object);
        if(target === 'child'){
            this.children[object.id] = object.name;
        }else if(target === 'parent'){
            this.parents[object.id] = object.name;
        }else{
            throw new Error(`Unrecognised target for relation: ${target}`);
        }
        return object;
    };

    GraphNode.prototype.getRelationObjects = function(){
        var tempList = this.relatedObjects;
        this.relatedObjects = [];
        return tempList;
    };

    
    return GraphNode;
});
