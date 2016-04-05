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
    var GraphNode = function(name,parentId,type,relationsToCreate,overRideId){
        //Note: relationstoCreate = { children: [{name,children,parents}], parents : [{}] }
        
        /** @type int The Id of the node */
        this.id = overRideId || nextId++;
        if(overRideId && overRideId > nextId){
            nextId = overRideId + 1;
        }

        /** @type String The Name of the Node */
        this.name = name || 'anon';

        /** descriptions of objects to create and link to this node
            @type {Array.<GraphNode>}
         */
        this.relatedObjects = [];
        //parents and children for links
        //storing by ID
        //Note: converted to *only* store id's, and not the objects
        //therefore no cycles, therefore json export

        //linked Nodes
        //id -> relationType. eg: child, parent, rule
        
        this.linkedNodes = {};

         if(parentId !== undefined){
            /** The Original Parent Id of the node
                @type {int}
            */
            this.linkedNodes[parentId] = "parent->original";
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

        /**
           Track whether the node is minimised or not
           @type {Boolean}
         */
        this.minimised = false;

        //Create the relations passed in:
        /*
          r = [
          {name, type, relType,recType, subRelations : [<r>]}
          ]
         */
        if(relationsToCreate !== undefined && relationsToCreate instanceof Array){
            this.relatedObjects = relationsToCreate;
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
    GraphNode.prototype.getDescriptionObjectsBase = function(fieldNameList){
        if(this.minimised){
            return [{
                name : this.toString() + "...",
                background : 'title'
            }];
        }
        //returns [{name: "", values : [] }]
        //Get all fields
        let lists = [];
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
            name : "Source For:",
            values : _.pairs(this.linkedNodes).filter(d=>/->source/.test(d[1])).map(d=>d.join(" : ")),
            background : "link",
        });

        lists.push({
            name : "Sink For:",
            values : _.pairs(this.linkedNodes).filter(d=>/->sink/.test(d[1])).map(d=>d.join(" : ")),
            background : "link"
        });
        
        return lists;
    };
    GraphNode.prototype.getDescriptionObjects = GraphNode.prototype.getDescriptionObjectsBase;
    
    /**
       Get a simple text description of the node
       @method 
       @returns {Object} {name: string}
     */
    GraphNode.prototype.getShortDescription = function(){
        return { name :`(${this.id}) ${this.name} : ${this.tags.type}`,
                 background : 'title',
                 nodeId : this.id
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
        if(field === 'id'){
            throw new Error("Can't modify id");
        }
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
       Returns the objects needing to be added to the shell, 
       as the node shouldnt store them for json compatibility
       @method
       @returns {Array.<GraphNode>}
     */
    GraphNode.prototype.pullRelationObjects = function(){
        let tempList = this.relatedObjects;
        this.relatedObjects = [];
        return tempList;
    };

    /**
       Search through the linkedNodes member for the specific relationtype
       @param {Array.<RegExp>} relationTypes
     */
    GraphNode.prototype.getActiveLinks = function(relationTypes){
        if(relationTypes == undefined || (relationTypes instanceof Array && relationTypes.length === 0)){
            //return everything this node is connected to
            return _.keys(this.linkedNodes);
        }
        if(!(relationTypes instanceof Array)){
            relationTypes = [relationTypes];
        }
        
        //take a keylist, return an array of all ids with matching relationtypes
        let members = new Set();
        _.pairs(this.linkedNodes).forEach(function(linkPair){
            relationTypes.forEach(function(regex){
                if(regex.test(linkPair[1])){
                    members.add(linkPair(1));
                }
            });
        });
        return Array.from(members);
    };

    
    return GraphNode;
});
