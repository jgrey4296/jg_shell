
define(['underscore'],function(_){
    "use strict";
    
    var SimulationCommands = {
        "draw" : function(globalData,values){
            //draw list of characters

            //draw list of performed actions
        },

        "cleanup" : function(globalData,values){

        },

        "setupSim" : function(globalData,values){
            console.log("Setting up simulation");
            //get all the nodes in the institution specified
            var maxTurns = values.shift() || 10,
                sourceId = values.shift() || globalData.shell.cwd.id;
            if(globalData.shell.getNode(sourceId).tags.type !== 'institution'){
                throw new Error("Simulation requires an institution");
            }

            //Get all the children of the specified institution
            var institutionIds = globalData.shell.dfs(sourceId,['children']),
                characters = _.values(globalData.shell.allNodes).filter(function(d){
                    return d.tags.character !== undefined;
                });
            console.log("InstitutionIds:",institutionIds);
            console.log("Characters:",characters);
            
            globalData.simulation = {};
            globalData.simulation.reteNet = globalData.shell.reteNet;
            globalData.simulation.characterPool = characters;
            globalData.simulation.usedCharacterPool = [];
            globalData.simulation.turn = 0;
            globalData.simulation.maxTurns = maxTurns;
            
            //compile the reteNet using the rules in the institution
            globalData.shell.compileRete(institutionIds);
            //assert starting facts
            //todo: possible initialise the institution from options here
            
            globalData.shell.assertWMEList(characters);
            globalData.shell.assertWMEs(institutionIds);

        },
        //returns true when finished, false otherwise
        "stepSim" : function(globalData,values){
            if(globalData.simulation === undefined){
                throw new Error("Simulation must be setup first, run 'setupSim' on an institution");
            }
            if(globalData.simulation.turn >= globalData.simulation.maxTurns) { return true; }
            console.log("Running sim turn: ",globalData.shell.reteNet.currentTime);
            //reset the character pool if empty
            if(globalData.simulation.characterPool.length === 0){
                globalData.simulation.characterPool = globalData.simulation.usedCharacterPool;
                globalData.simulation.usedCharacterPool = [];
            }            
            //select a character to act, remove from pool of characters
            //todo: let user specify an id of a character to act
            var charToUse = _.sample(globalData.simulation.characterPool),
                //Get actions for that character
                actionsForChar = _.filter(globalData.simulation.reteNet.proposedActions,
                                          function(d){
                                              try{
                                                  //TODO: FIX THIS
                                                  return d.payload.tags.character === charToUse.id;
                                              }catch(e){
                                                  return false;
                                              }
                                          }),
                //select a performance... based on something?
                //based on lookup of values of aggregates?
                //!!!! - base on normative level???
                actionToPerform = _.sample(actionsForChar),
                //Get the linked actions (assertions/retractions) for that performance
                linkedActions = actionToPerform !== undefined ? actionToPerform.parallelActions.map(function(d){
                    return globalData.simulation.reteNet.proposedActions[d.id];
                }) : [];
            console.log("CharToUse:",[charToUse,actionsForChar,actionToPerform]);
            
            //return early if theres no available actions
            if(actionToPerform === undefined) { return false; }
            //todo: perform the action
            //convert performance description to actual


            
            //add actual performance to list of performances, which will be drawn in draw
            
            
            //todo:assert facts, retract facts based on the action, which may remove the action from potentials.
            
            //increment time
            globalData.shell.stepTime();
            globalData.simulation.turn++;
            //-----
            //finish and summarise

            return false;
        },
        "dfs" : function(globalData,values){
            if(values.length === 0) { values = [globalData.shell.cwd.id]; }
            console.log(globalData.shell.dfs(values[0]));
        },
        "help" : function(globalData,values){
            return {
                "setupSim" : ["$sourceId?","Initialise the retenet for simulation"],
                "stepSim" : ["", "Run a step of the simulation"],
            };
        },
    };

    return SimulationCommands;
});
