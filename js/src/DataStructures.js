if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','underscore'],function(RDS,_){
    var nextId = 0;
    //The main node type of the graph:
    var GraphNode = function(name,parentId,type,overRideId){
        //Id and name for identification
        this.id = overRideId || nextId++;
        if(overRideId) nextId = overRideId + 1;
            
        this.name = name;
        //parents and children for links
        //storing by ID
        //Note: converted to *only* store id's, and not the objects
        //therefore no cycles, therefore json export
        this.parents = {};
        if(parent){
            this._originalParent = parentId;
            this.parents[parentId] = true;//parent;
        }
        
        this.children = {};

        //values and tags and annotations for data
        this.values = {};
        this.tags = {};
        this.tags.type = type || 'GraphNode';
        this.annotations = {};

        //for if its a rule object:
        this.rule = undefined;
        
    };


    //----------------------------------------
    //----------------------------------------
    //Interface, and shortcut aliases
    var theInterface = {
        "GraphNode" : GraphNode,
        "graphnode" : GraphNode,
        "node"      : GraphNode,
    };
    
    return theInterface;      
});
