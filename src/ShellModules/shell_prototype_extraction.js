if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var ShellPrototype = {};

    /**
       @method extractFactPrototypes
       @purpose to extract the prototypes of facts in rules, for comparison to existing prototypes
       @TODO currently filtering out NCCConditions, and retractions
    */
    ShellPrototype.extractFactPrototypes = function(){
        this.allRules = _.values(this.allNodes).filter(function(d){
            return d.tags.type === "rule";
        });
        
        //all constantTestPrototypes:
        var constTestPrototypes = _.flatten(this.allRules.map(function(rule){ //for all rules
            return rule.conditions.filter(function(cond){ //get all positive conditions
                return cond.isNCCCondition === undefined;
            }).map(function(cond){ //create an object from the tests of each condition
                return cond.constantTests.reduce(function(memo,currTest){
                    memo[currTest.field] = currTest.value;
                    return memo;
                },{});
            });
        }));

        //TODO: fold individual prototypes into same objects with lists of possible values
        var combinedPrototypes = constTestPrototypes.reduce(function(obj){

        },{});
       
        console.log("Inferred Test Prototypes:",constTestPrototypes);
        //Combine together:
        return {
            "testPrototypes":constTestPrototypes,
        };
    };

    
    return ShellPrototype;
});
