/**
   @file ReteInterface
   @purpose Provides functions for operating on a retenet object
 */

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

//** @requires ReteDataStructures
define(['Rete/ReteDataStructures','Rete/ReteDeletion','Rete/ReteActivations','Rete/ReteNetworkBuilding','Rete/ReteComparisonOperators'],function(RDS,ReteDeletion,ReteActivations,ReteNetworkBuilding,RCO){
    
    /**
       @function clearActivations
       @purpose To clear the record of the last activated rules, for new activations
       @note pushes the cleared activations in a record array in the rete object
     */
    var clearActivations = function(reteNet){
        var previousActivations = reteNet.lastActivatedRules;
        reteNet.lastActivatedRules = [];
        reteNet.previousActivations.push(previousActivations);
    };

    /**
       @function addWME
       @purpose Creates a wme from the passed in data, schedules it for assertion
     */
    //Assert a wme into the network
    var addWME = function(wmeData,reteNet,retractionTime,assertionTime){
        //Create the wme:
        if(assertionTime === undefined) assertionTime = reteNet.currentTime;
        if(retractionTime === undefined) retractionTime = reteNet.currentTime;
        var wme = new RDS.WME(wmeData,assertionTime,retractionTime);
        console.log("Asserting:",wme);
        //Add it to the input WME Buffer:
        addToAssertionList(reteNet,wme,assertionTime);
        addToRetractionList(reteNet,wme,retractionTime);
        //Store it as part of allWMEs:
        reteNet.allWMEs[wme.id] = wme;
        return wme.id;
    };


    /**
       @function removeWME
       @purpose to clean up all places a wme is stored, and remove its consequences
     */
    var removeWME = function(wme,reteNet){
        ReteDeletion.removeAlphaMemoryItemsForWME(wme);
        ReteDeletion.deleteAllTokensForWME(wme);
        ReteDeletion.deleteAllNegJoinResultsForWME(wme);
    };

    
    /**
       @function addToAssertionList
       @purpose to record when a wme needs to be asserted
       @note: increment time will use this information
     */
    var addToAssertionList = function(reteNet,wme,time){
        if(reteNet.wmeLifeTimes.assertions[time] === undefined){
            reteNet.wmeLifeTimes.assertions[time] = [];
        }
        reteNet.wmeLifeTimes.assertions[time].push(wme);
    }

    /**
       @function addToRetractionList
       @purpose to record when a wme needs to be retracted
       @note: increment time will use this information
    */
    var addToRetractionList = function(reteNet,wme,time){
        if(reteNet.wmeLifeTimes.retractions[time] === undefined){
            reteNet.wmeLifeTimes.retractions[time] = [];
        }
        reteNet.wmeLifeTimes.retractions[time].push(wme);
    }
    
    /**
       @function incrementTime
       @purpose steps the retenet forwards by one step. asserts new wmes, and then retracts old wmes
       @TODO figure out if this is in the correct order. should it be the otherway around
     */
    var incrementTime = function(reteNet){
        //assert everything schdeuled
        reteNet.wmeLifeTimes.assertions[reteNet.currentTime].forEach(function(wme){
            ReteActivations.alphaNodeActivation(reteNet.rootAlpha,wme);
        });

        //retract everything scheduled
        reteNet.wmeLifeTimes.retractions[reteNet.currentTime].forEach(function(wme){
            removeWME(wme,reteNet);
        });
        //increment the time
        reteNet.currentTime++;
    };


    /**
       @function addRule
       @purpose to build a network for a given rule
     */
    var addRule = function(rule,reteNet){
        //build network with a dummy node for the parent
        var currentNode = ReteNetworkBuilding.buildOrShareNetworkForConditions(reteNet.dummyBetaMemory,rule.conditions,reteNet.rootAlpha);
        //Build the actions that are triggered by the rule:
        var actionNodes = _.values(rule.actions).map(function(d){
            console.log("Adding action for:",d);
            return new RDS.ActionNode(currentNode,d,rule.name,reteNet);
        });

        //initialise the action storage for this rule
        if(reteNet.actions[rule.name] === undefined){
            reteNet.actions[rule.name] = [];
        }
        //update node with matches
        actionNodes.forEach(function(d){
            reteNet.actions[rule.name].push(d);
        });
        return actionNodes;
    };

    /**
       @function removeRule
       @purpose to remove a rule from the network
    */
    var removeRule = function(actionNode){
        //delete from bottom up
        ReteDeletion.deleteNodeAndAnyUnusedAncestors(actionNode);
    };

    
    var interface = {
        "ReteNet" : RDS.ReteNet,
        "Condition" : RDS.Condition,
        "ConstantTest" : RDS.ConstantTest,
        "CompOperators" : RCO,
        "clearActivations" : clearActivations,
        "addWME" : addWME,
        "removeWME" : removeWME,
        "incrementTime" : incrementTime,
        "addRule" : addRule,
        "removeRule" : removeRule,

    };
    return interface;    
});
