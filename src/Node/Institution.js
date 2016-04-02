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
        let relations = [
            {name: "roles", relType : 'child', recType : 'parent', subRelations : "incumbent challenger controlled exempt".split(" ").map(d=>({name:d, relType : 'child', recType : 'parent'}))},
            {name: "activities", subRelations : "physical symbolic communicative unbound".split(" ").map(d=>({name:d, relType : 'child', recType : 'parent'}))},
            {name : "IGU", relType : 'child', recType : 'parent'},
            {name: "FactGrammar", relType : 'child', recType : 'parent', subRelations : "physical symbolic communicative unbound".split(" ").map(d=>({name:d, relType : 'child', recType : 'parent'}))},
            {name : "valueHierarchy", relType : 'child', recType : 'parent'},
            {name: "norms", relType : 'child', recType :'parent', subRelations : "empiricallyExpected normativelyExpected sanctionable".split(" ").map(d=>({name:d, relType :'child',recType:'parent'}))},
            {name: "externalEffectors", relType : 'child', recType : 'parent'}
        ];
        GraphNode.call(this,name,parent,"institution",relations,overRideId);
    };
    Institution.constructor = Institution;
    Institution.prototype = Object.create(GraphNode.prototype);
    
    
    return Institution;
});
