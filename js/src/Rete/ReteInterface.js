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
    imports.push("underscore");
}else{
    imports = imports.map(function(d){
        return "Rete/"+d;
    });
    imports.push("underscore");
}

//** @requires ReteDataStructures
define(imports,function(RDS,ReteDeletion,ReteActivations,ReteNetworkBuilding,RCO,_){
    "use strict";
    console.log("rete interface");
    /**
       @function clearActivations
       @purpose To clear the record of the last activated rules, for new activations
       @note pushes the cleared activations in a record array in the rete object
       @DEPRECATED
     */
    // var clearActivations = function(reteNet){
    //     var previousActivations = reteNet.lastActivatedRules;
    //     reteNet.lastActivatedRules = [];
    //     reteNet.previousActivations.push(previousActivations);
    // };

    var clearHistory = function(reteNet){
        reteNet.enactedActions = [];
    };

    var clearPotentialActions = function(reteNet){
        reteNet.potentialActions = [];
    };
    
    //Assert a wme RIGHT NOW
    var assertWME_Immediately = function(data,reteNet,retractionTime){
        if(retractionTime === undefined) retractionTime = 0;
        if(data.isWME === undefined || data.id === undefined){
            data = new RDS.WME(data,reteNet.currentTime,retractionTime);
            addToRetractionList(reteNet,data,data.lifeTime[1]);
            reteNet.allWMEs[data.id] = data;
        }
        //Actually push the wme into the net
        ReteActivations.alphaNodeActivation(reteNet.rootAlpha,data);
        return data.id;
    };

    //Retract a wme RIGHT NOW, clean up its tokens, and any potential actions
    var retractWME_Immediately = function(wme,reteNet){
        if(wme.isWME === undefined){
            if(!Number.isInteger(wme) || reteNet.allWMEs[wme] === undefined){
                throw new Error("Not Retracting a wme, or a valid id"); 
            }
            wme = reteNet.allWMEs[wme];
        }
        ReteDeletion.removeAlphaMemoryItemsForWME(wme);
        var invalidatedActionIds = ReteDeletion.deleteAllTokensForWME(wme);
        //todo: cleanup invalidated actions
        cleanupProposedActions(reteNet,invalidatedActionIds);
        
        ReteDeletion.deleteAllNegJoinResultsForWME(wme);
    };
    
    /**
       @function addWME
       @purpose Creates a wme from the passed in data, schedules it for assertion
       @note There is a difference between ADDING to the net and the initial ACTIVATION of the root
     */
    //Assert a wme into the network
    var assertWME_Later = function(wmeData,reteNet,assertionTime,retractionTime){
        //Create the wme:
        if(assertionTime === undefined) assertionTime = reteNet.currentTime;
        if(retractionTime === undefined) retractionTime = 0;
        if(wmeData.isWME === undefined || wmeData.id === undefined){
            wmeData = new RDS.WME(wmeData,assertionTime,retractionTime);
            reteNet.allWMEs[wme.id] = wme;
        }
        //Add it to the input WME Buffer:
        addToAssertionList(reteNet,wme);
        addToRetractionList(reteNet,wme);
        //Store it as part of allWMEs:
        return wme.id;
    };
    
    /**
       @function addToAssertionList
       @purpose to record when a wme needs to be asserted
       @note increment time will use this information
     */
    var addToAssertionList = function(reteNet,wme,time){
        if(wme.isWME === undefined){
            if(!Number.isInteger(wme) || reteNet.allWMEs[wme] === undefined){
                throw new Error("Trying to register an invalid wme");
            }
            wme = reteNet.allWMEs[wme];
        }
        if(time === undefined) {
            time = wme.lifeTime[0];
        }else{
            wme.lifeTime[0] = time;
        }
        if(reteNet.wmeLifeTimes.assertions[time] === undefined){
            reteNet.wmeLifeTimes.assertions[time] = [];
        }
        reteNet.wmeLifeTimes.assertions[time].push(wme);
    };

    /**
       @function addToRetractionList
       @purpose to record when a wme needs to be retracted
       @note increment time will use this information
    */
    var addToRetractionList = function(reteNet,wme,time){
        if(wme.isWME === undefined){
            if(!Number.isInteger(wme) || reteNet.allWMEs[wme] === undefined){
                throw new Error("Trying to register an invalid wme");
            }
            wme = reteNet.allWMEs[wme];
        }
        if(reteNet.wmeLifeTimes.retractions[time] === undefined){
            reteNet.wmeLifeTimes.retractions[time] = [];
        }
        reteNet.wmeLifeTimes.retractions[time].push(wme);
    };
    
    /**
       @function incrementTime
       @purpose steps the retenet forwards by one step. retracts then asserts new wmes,
       @TODO figure out if this is in the correct order. should it be the otherway around
     */
    var incrementTime = function(reteNet){
        //retract everything scheduled
        if(reteNet.wmeLifeTimes.retractions.length > reteNet.currentTime){
        reteNet.wmeLifeTimes.retractions[reteNet.currentTime].forEach(function(wme){ retractWME_Immediately(wme,reteNet); });
        }
        console.log("Retractions finished");
        //assert everything schdeuled
        if(reteNet.wmeLifeTimes.assertions.length > reteNet.currentTime){
            reteNet.wmeLifeTimes.assertions[reteNet.currentTime].forEach(function(wme){  assertWME_Immediately(reteNet.rootAlpha,wme,wme.lifeTime[1]); });
        }
        console.log("Assertions finished");
        
        //At this point: newly activated action instructions are in
        //reteNet.potentialActions,
        //and non-decidable actions are scheduled
        //nothing is asserted immediately to stop infinite inference loops
        
        //increment the time
        reteNet.currentTime++;

    };

    /**
       @function addRule
       @purpose to build a network for a given rule
       @note Assumes the rule's actions and conditions are objects, not id's,
       @note and allNodes store all relevant objects
       @note see TotalShell::compileRete
     */
    var addRule = function(ruleId,reteNet,allNodes){
        if(!Number.isInteger(ruleId) || allNodes[ruleId] === undefined){
            throw new Error("Unrecognised rule id specified");
        }
        var rule = allNodes[ruleId],        
            conditions = _.keys(rule.conditions).map(function(d){
                return this[d];
            },allNodes),                
            //build network with a dummy node for the parent
            currentNode = ReteNetworkBuilding.buildOrShareNetworkForConditions(reteNet.dummyBetaMemory,conditions,reteNet.rootAlpha,allNodes,reteNet),
            //Build the actions that are triggered by the rule:
            actionNodes = _.keys(rule.actions).map(function(actionId){
                console.log("Adding action for:",actionId);
                var actionDescription = allNodes[actionId];
                return new RDS.ActionNode(currentNode,actionDescription,rule.name,reteNet);
            });

        //initialise the action storage for this rule
        if(reteNet.actions[rule.id] === undefined){
            reteNet.actions[rule.id] = [];
        }
        //update node with matches
        actionNodes.forEach(function(d){
            reteNet.actions[rule.id].push(d);
        });
        return actionNodes;
    };

    /**
       @function removeRule
       @purpose to remove a rule from the network
    */
    var removeRule = function(actionNode,reteNet){
        //delete from bottom up
        var invalidatedActionIds = ReteDeletion.deleteNodeAndAnyUnusedAncestors(actionNode);
        cleanupProposedActions(reteNet,invalidatedActionIds);
    };


    //remove proposed actions from the retenet, and from their owning tokens
    var cleanupProposedActions = function(reteNet,idList){
        var potentialActions = reteNet.potentialActions;
        //filter out the ids from the potentialActions list
        //also removing them from the owning tokens

    };
    
    var moduleInterface = {
        "ReteNet" : RDS.ReteNet,
        "ConstantTest" : RDS.ConstantTest,
        "CompOperators" : RCO,
        "clearHistory" : clearHistory,
        "clearPotentialActions" : clearPotentialActions,
        "assertWME_Immediately" : assertWME_Immediately,
        "retractWME_Immediately" : retractWME_Immediately,
        "assertWME_Later" : assertWME_Later,
        "incrementTime" : incrementTime,
        "addRule" : addRule,
        "removeRule" : removeRule,
    };
    return moduleInterface;    
});
