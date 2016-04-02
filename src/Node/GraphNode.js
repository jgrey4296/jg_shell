if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}
/**
   The main node type of the graph
   @module Node/GraphNode
   @see GraphNode
*/
define(['underscore'],function(_){
    "use strict";
    var nextId = 0,
        //for a field name 'a' lookup a colour in global data called 'b'
        colourMap = {
            'values' : 'data',
            'tags' : 'tags',
            'expectedBy' : 'link',
            'producedBy' : 'link'
        };
    /**
       A node of the overall graph
       @constructor
       @alias GraphNode
    */
    var GraphNode = function(name,parent,type,relationsToCreate,overRideId){
        //Note: relationstoCreate = { children: [{name,children,parents}], parents : [{}] }
        
        /** @type int The Id of the node */
        this.id = overRideId || nextId++;
        if(overRideId && overRideId > nextId){
            nextId = overRideId + 1;
        }

        /** @type String The Name of the Node */
        this.name = name;

        /** Parents and children created internally, ready to be sent to the shell for registration 
            @type {Array.<GraphNode>}
         */
        this.relatedObjects = [];
        //parents and children for links
        //storing by ID
        //Note: converted to *only* store id's, and not the objects
        //therefore no cycles, therefore json export

        //linked Nodes
        this.linkedNodes = {
            children : {},
            parents : {},
            consumedBy : {},
            producedBy : {}
        };
        
        /** The child Ids of the node
            @type {Object.<GraphNode#id,GraphNode#name>}
         */
        //this.children = {};
        
        /** Parent  Ids of the node
            @type {Object.<GraphNode#id,GraphNode#name>}
         */
        //this.parents = {};

        
        if(parent !== undefined){
            /** The Original Parent Id of the node
                @type {int}
             */
            this.linkedNodes._originalParent = parent.id;
            this.linkedNodes.parents[parent.id] = parent.name;
        }

        /** Stored Data: Values 
            @type {Object.<String,String>}
        */
        this.values = {};
        
        /** Stored Data : Tags 
            @type {Object.<String,String>}
         */
        this.tags = {};
        
        /** Stored Data : Annotations 
            @type {Object.<String,String>}
        */
        this.annotations = {};

        /** Used to update the prototype on json-imported data */
        this.tags.type = type || 'graphnode';

                
        /** Rules that consume this fact into their conditions
            @type {Object.<GraphNode#id,GraphNode#name>}
         */
        //this.expectedBy = {};
        
        /** Rules that produce this fact: 
            @type {Object.<GraphNode#id,GraphNode#name>}
         */
        //this.producedBy = {};

        /**
           Track whether the node is minimised or not
           @type {Boolean}
         */
        this.minimised = false;

        //Create the relations passed in:
        //Each entry in the list: L = { name: "", children : [L], parents : [L] }
        if(relationsToCreate !== undefined && relationsToCreate.children !== undefined){
            relationsToCreate.children.forEach(function(d){
                let relations = (d.children && d.parents) ? {
                    children : d.children,
                    parents : d.parents,
                } : undefined,
                    subName = d.name || d;
                this.addRelation('children',new GraphNode(subName,this,undefined,relations));
            },this);
        }

        if(relationsToCreate !== undefined && relationsToCreate.parents !== undefined){
            relationsToCreate.parents.forEach(function(d){
                var relations = {
                    children : d.children,
                    parents : d.parents,
                },
                    subName = d.name || d;
                this.addRelation('parents',new GraphNode(subName,this,undefined,relations));
            },this);

        }
        
    };
    GraphNode.constructor = GraphNode;
    
    /**
       Convert to a string
       @method
       @returns {String} 
     */
    GraphNode.prototype.toString = function(){
        return `(${this.id}) : ${this.name.slice(0,10)}`;
    };

    /**
       Returns a list of objects for visualisation
       @method 
       @param fieldNameList
       @returns {Array.<Object>} Objects of {name: String, values: Array}
     */
    GraphNode.prototype.getDescriptionObjects = function(fieldNameList){
        if(this.minimised){
            return [{
                name : this.toString() + "...",
                background : 'title'
            }];
        }
        //returns [{name: "", values : [] }]
        //Get all fields
        var lists = [];
        lists.push({
            name : this.toString(),
            background : 'title'
        });

        lists.push({
            name : "Tags",
            values : _.pairs(this.tags).map(d=>d.join(" : ")),
            background : 'tags'
        });

        lists.push({
            name : "Values",
            values : _.pairs(this.values).map(d=>d.join(" : ")),
            background : 'data'
        });

        lists.push({
            name : "Annotations",
            values : _.pairs(this.annotations).map(d=>d.join(" : ")),
            background : "lightBlue"
        });

        lists.push({
            name : "ExpectedBy",
            values : _.pairs(this.expectedBy).map(d=>d.join(" : ")),
            background : "link",
        });

        lists.push({
            name : "ProducedBy",
            values : _.pairs(this.producedBy).map(d=>d.join(" : ")),
            background : "link"
        });
        
        return lists;
    };

    /**
       Get a simple text description of the node
       @method 
       @returns {Object} {name: string}
     */
    GraphNode.prototype.getShortDescription = function(){
        return { name :`(${this.id}) ${this.name} : ${this.tags.type}`,
                 background : 'title'
               };
    };
    
    
    /**
       Set a value in the node. as a scalar if no parameter is specified
       @param value
       @param field
       @param parameter
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
       @param target
       @param object
       @method
     */
    GraphNode.prototype.addRelation = function(target,object){
        if(!(object instanceof GraphNode)){
            throw new Error("Trying to add a non-GraphNode relation");
        }
        this.relatedObjects.push(object);
        if(this.linkedNodes[target] === undefined){
            this.linkedNodes[target] = {};
        }
        this.linkedNodes[target][object.id] = object.name;
        return object;
    };

    /**
       Returns the objects needing to be added to the shell, 
       as the node shouldnt store them for json compatibility
       @method
       @returns {Array.<GraphNode>}
     */
    GraphNode.prototype.getRelationObjects = function(){
        var tempList = this.relatedObjects;
        this.relatedObjects = [];
        return tempList;
    };

    GraphNode.prototype.getActiveLinks = function(keyList){
        if(keyList == undefined){ keyList = _.keys(this.linkedNodes); }
        //take a keylist, return an array of all ids in those fields
        let members = new Set();
        keyList.forEach(function(key){
            if(typeof this.linkedNodes[key] === 'object'){
                _.keys(this.linkedNodes[key]).forEach(d=>members.add(d));
            }else{
                members.add(this.linkedNodes[key]);
            }
        },this);

        return Array.from(members);
    };

    
    return GraphNode;
});
