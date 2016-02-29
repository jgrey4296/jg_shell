/**
   To define the base data structure for the shell
   @module Node/Institution
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){
    "use strict";
    /**
       @constructor
       @alias Node/Institution
       @augments module:Node/GraphNode
     */
    var Institution = function(name,parent,dummyType,dummyRelations,overRideId){
        var relations = {
            children : [
                {name: "roles", children : "incumbent challenger controlled exempt".split(" ")},
                {name: "activities", children : "physical symbolic communicative unbound".split(" ")},
                "IGU",
                {name: "FactGrammar", children : "physical symbolic communicative unbound".split(" ")},
                "valueHierarchy",
                {name: "norms", children : "empiricallyExpected normativelyExpected sanctionable".split(" ")}
            ],
            parents : ["externalEffectors"]
        };
        GraphNode.call(this,name,parent,"Institution",relations,overRideId);
    };
    Institution.constructor = Institution;
    Institution.prototype = Object.create(GraphNode.prototype);
    
    
    return Institution;
});