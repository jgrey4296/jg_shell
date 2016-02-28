if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

/** 
    Aggregates the constructors toget
    @module Node/Constructors
 */
define(['underscore','./GraphNode','./Rule','./Condition','./Action','./Institution','./Bookmark'],function(_,GraphNode,Rule,Condition,Action,Institution,Bookmark){
    "use strict";
    var ctors = {
        "graphnode" : GraphNode,
        "rule"      : Rule,
        "condition" : Condition,
        "action"    : Action,
        "institution" : Institution,
        "bookmark" : Bookmark
    };

    /**
       @function
     */
    var getCtor = function(name){
        if(ctors[name.toLowerCase()] !== undefined){
            return ctors[name.toLowerCase()];
        }
        return ctors.graphnode;
    };
    
    return getCtor;
});
