/**
   @file Institution
   @purpose To define the base data structure for the shell
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){
    "use strict";
    var nextId = 0;
    //The main node type of the graph:
    var Institution = function(name,parent,overRideId){
        var relations = {
            children : [
                {name: "roles", children : "incumbent challenger controlled exempt".split(" ")},
                {name: "activities", children : "physical symbolic communicative unbound".split(" ")},
                "IGU",
                {name: "FactGrammar", children : "physical smybolic communicative unbound".split(" ")},
                "valueHierarchy",
                {"norms" : children : "empiricallyExpected normativelyExpected santionable".split(" ")}
            ],
            parents : ["externalEffectors"]
        };
        GraphNode.call(this,name,parent,"Institution",relations,overRideId);
    };
    Institution.constructor = Institution;
    Institution.prototype = Object.create(GraphNode.prototype);
    
    
    return Institution;
});
