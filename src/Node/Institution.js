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
       @param name
       @param parent
       @param dummyType
       @param dummyRelations
       @param overRideId
     */
    var Institution = function(name,parent,dummyType,dummyRelations,overRideId){
        let relations = {
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
        GraphNode.call(this,name,parent,"institution",relations,overRideId);
    };
    Institution.constructor = Institution;
    Institution.prototype = Object.create(GraphNode.prototype);
    
    
    return Institution;
});
