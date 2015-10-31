if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','underscore'],function(RDS,_){
    var nextId = 0;
    //The main node type of the graph:
    var GraphNode = function(name,parentId,parentName,type,overRideId){
        //Id and name for identification
        this.id = overRideId || nextId++;
        if(overRideId) nextId = overRideId + 1;
            
        this.name = name;
        //parents and children for links
        //storing by ID
        //Note: converted to *only* store id's, and not the objects
        //therefore no cycles, therefore json export
        this.parents = {};
        if(parentId !== undefined){
            this._originalParent = parentId;
            this.parents[parentId] = parentName;//parent;
        }
        
        this.children = {};

        //values and tags and annotations for data
        this.values = {};
        this.tags = {};
        this.tags.type = type || 'GraphNode';
        this.annotations = {};

        //a rule node is supplemented in its ctor with:
        //this.conditions
        //this.actions

        //an action is supplemented with:
        //this.arithmeticActions

        //a condition is supplemented by:
        //tests
        //bindings (or is this just the values?)
        
    };

    return GraphNode;
});
