if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

/** 
    Aggregates the constructors toget
    @module Node/Constructors
 */
define(['underscore','./GraphNode','./Rule','./Condition','./Action','./Institution','./Bookmark','./State','./FSM','./Event'],function(_,GraphNode,Rule,Condition,Action,Institution,Bookmark,State,FSM,Event){
    "use strict";
    const ctors = new Map([
        ["graphnode" , GraphNode],
        ["rule"      , Rule],
        ["condition" , Condition],
        ["action"    , Action],
        ["institution" , Institution],
        ["bookmark" , Bookmark],
        ["state" , State],
        ["event" , Event],
        ["fsm" , FSM],
    ]);

    /**
       Get the Constructor specified
       @function
       @param name
     */
    var getCtor = function(name){
        if(name !== undefined && ctors.has(name.toLowerCase())){
            return ctors.get(name.toLowerCase());
        }
        return ctors.get("graphnode");
    };
    
    return getCtor;
});
