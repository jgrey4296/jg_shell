/**
   @file ReteInterface
   @purpose Provides functions for operating on a retenet object
 */
var imports = ["ReteDataStructures","ReteDeletion","ReteActivations","ReteNetworkBuilding","ReteComparisonOperators"];

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
    imports = imports.map(function(d){
        return "./"+d;
    });
}else{
    imports = imports.map(function(d){
        return "Rete/"+d;
    });
}

//** @requires ReteDataStructures
define(imports,function(RDS,ReteDeletion,ReteActivations,ReteNetworkBuilding,RCO){
    
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
        if(retractionTime === undefined) retractionTime = 0;
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
        //retract everything scheduled
        if(reteNet.wmeLifeTimes.retractions.length > reteNet.currentTime){
        reteNet.wmeLifeTimes.retractions[reteNet.currentTime].forEach(function(wme){ removeWME(wme,reteNet); });
        }
        console.log("retractions finished");
        //assert everything schdeuled
        if(reteNet.wmeLifeTimes.assertions.length > reteNet.currentTime){
        reteNet.wmeLifeTimes.assertions[reteNet.currentTime].forEach(function(wme){  ReteActivations.alphaNodeActivation(reteNet.rootAlpha,wme); });
        }
        
        
        //At this point: newly activated action instructions are in
        //reteNet.lastActivatedRules
        var newWMEs = [];
        //import all the events in lastActivatedRules into the relevant lists
        reteNet.lastActivatedRules.forEach(function(activeRule){
            if(activeRule.action === "assert"){
                activeRule.resultingWME = addWME(activeRule.payload,reteNet,
                                    activeRule.assertTime,
                                    activeRule.retractTime);
            }else if(activeRule.action === "retract"){
                activeRule.payload.forEach(function(wme){
                    removeWME(wme,reteNet);
                });
            }else if(activeRule.action === "modify"){
                throw new Error("modify not implemented yet");
            }else{
                //possibly unknown actions should not error,
                //as they will be used in whatever interfaces with the net
                console.error(activeRule);
                throw new Error("unknown action to perform:");
            }
        });
        
        //increment the time
        reteNet.currentTime++;

        return newWMEs;
    };


    /**
       @function addRule
       @purpose to build a network for a given rule
       @note Assumes the rule's actions and conditions are objects, not id's.
       @note see TotalShell::compileRete
     */
    var addRule = function(rule,reteNet,allNodes){
        var conditions = _.keys(rule.conditions).map(function(d){
            return this[d];
        },allNodes);
                
        //build network with a dummy node for the parent
        var currentNode = ReteNetworkBuilding.buildOrShareNetworkForConditions(reteNet.dummyBetaMemory,conditions,reteNet.rootAlpha,allNodes);
        //Build the actions that are triggered by the rule:
        var actionNodes = _.keys(rule.actions).map(function(actionId){
            console.log("Adding action for:",actionId);
            var actionDescription = allNodes[actionId];
            return new RDS.ActionNode(currentNode,actionDescription,rule.name,reteNet);
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
