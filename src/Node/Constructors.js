if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode','./Rule','./Condition','./Action','./Institution'],function(_,GraphNode,Rule,Condition,Action,Institution){

    var ctors = {
        "graphnode" : GraphNode,
        "rule"      : Rule,
        "condition" : Condition,
        "action"    : Action,
        "institution" : Institution

    };

    var getCtor = function(name){
        if(ctors[name.toLowerCase()] !== undefined){
            return ctors[name.toLowerCase()];
        }
        return ctors['graphnode'];
    }
    
    return getCtor;
});
