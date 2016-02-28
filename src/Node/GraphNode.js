/**
   To define the base data structure for the shell
   @module Node/GraphNode
   @see {@link Node/GraphNode}
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var nextId = 0;
    /**
       The main node type of the graph:
       @constructor
       @alias Node/GraphNode
     */
    var GraphNode = function(name,parent,type,relationsToCreate,overRideId){
        //Note: relationstoCreate = { children: [{name,children,parents}], parents : [{}] }
        /** The id of the node */
        this.id = overRideId || nextId++;
        if(overRideId && overRideId > nextId){
            nextId = overRideId + 1;
        }

        /** The Name of the Node */
        this.name = name;

        /** Parents and children created internally, ready to be sent to the shell for registration */
        this.relatedObjects = [];

        //parents and children for links
        //storing by ID
        //Note: converted to *only* store id's, and not the objects
        //therefore no cycles, therefore json export
        /** children */
        this.children = {};
        /** parents */
        this.parents = {};
        if(parent !== undefined){
            this._originalParent = parent.id;
            this.parents[parent.id] = parent.name;
        }

        /** Stored Data: Values */
        this.values = {};
        /** Stored Data : Tags */
        this.tags = {};
        /** Stored Data : Annotations */
        this.annotations = {};

        /** Used to update the prototype on json-imported data */
        this.tags.type = type || 'graphnode';

        /* Relations to Rules */
        /** Rules that consume this fact: */
        this.expectedBy = {};
        /** Rules that produce this fact: */
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

    /**
       Convert to a string
       @method
     */
    GraphNode.prototype.toString = function(){
        return `(${this.id}) : ${this.name.slice(0,10)}`;
    };

    /**
       Returns a list of objects for visualisation
       @method 
       
     */
    GraphNode.prototype.getDescriptionObjects = function(fieldNameList){
        //returns [{name: "", values : [] }]
        //Get all fields
        var lists = fieldNameList.map(function(d){
            //as a simple { name : "key : value" } object
            if(typeof this[d] === "string" || typeof this[d] === 'number'){
                return { name : `${d} : ${this[d]}` };
            }
            //as a { name : key, values : ["$key : $value"] } object
            return {
                name: d,
                values : _.keys(this[d]).sort().map(e=>`${e} : ${this[d][e]}`)
            };
        },this);
        return lists;
    };

    /**
       Get a simple text description of the node
       @method 
     */
    GraphNode.prototype.getShortDescription = function(){
        return {name :`(${this.id}) ${this.name} : ${this.tags.type}` };
    };
    
    
    /**
       Set a value in the node. as a scalar if no parameter is specified
       @method
     */
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

    /**
       Register a NodeStyle object as a relation of this node. stores id+name
       and adds to the relatedObjects map;
       @method
     */
    GraphNode.prototype.addRelation = function(target,object){
        if(!(object instanceof GraphNode)){
            throw new Error("Trying to add a non-GraphNode relation");
        }
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

    /**
       Returns the objects needing to be added to the shell, as the node shouldnt store them for json compatibility
       @method
     */
    GraphNode.prototype.getRelationObjects = function(){
        var tempList = this.relatedObjects;
        this.relatedObjects = [];
        return tempList;
    };

    
    return GraphNode;
});
