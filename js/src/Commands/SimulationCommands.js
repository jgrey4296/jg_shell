
define(['underscore'],function(_){
    "use strict";
    
    var SimulationCommands = {
        "draw" : function(globalData,values){

        },

        "cleanup" : function(globalData,values){

        },

        "setupSim" : function(globalData,values){
            console.log("Setting up simulation");
            //get all the nodes in the institution specified
            var sourceId = values.shift() || globalData.shell.cwd.id;
            if(globalData.shell.getNode(sourceId).tags.type !== 'institution') return;
            
            var institutionIds = globalData.shell.dfs(sourceId,['children']),
                characters = _.values(globalData.shell.allNode).filter(function(d){
                    return d.tags.character !== undefined;
                });

            globalData.simulation = {};
            globalData.simulation.reteNet = globalData.shell.reteNet;
            globalData.simulation.characterPool = characters;
            globalData.simulation.usedCharacterPool = [];
            globalData.simulation.turn = 0;
            globalData.simulation.maxTurns = values.shift() || 10;

            
            //compile the reteNet using the rules
            globalData.shell.compileRete(institutionIds);
            //assert starting facts
            //todo: possible initialise the institution from options here
            
            globalData.shell.assertWMEList(characters);
            globalData.shell.assertWMEs(institutionIds);


        },
        //returns true when finished, false otherwise
        "stepSim" : function(globalData,values){
            if(globalData.simulation.turn >= gobalData.simulation.maxTurns) return true;
            
            console.log("Running sim turn: ",globalData.shell.reteNet.currentTime);
            //select a character to act, remove from pool of characters
            if(globalData.simulation.characterPool.length === 0){
                globalData.simulation.characterPool = globalData.simulation.usedCharacterPool;
                globalData.simulation.usedCharacterPool = [];
            }            

            var charToUse = _.sample(globalData.simulation.characterPool),
                actionsForChar = _.filter(globalData.simulation.reteNet.potentialActions,
                                          function(d){
                                              try{
                                                  return d.payload.tags.character === charToUse.id;
                                              }catch(e){
                                                  return false;
                                              }
                                          }),
                actionToPerform = _.sample(actionsForChar);
            
            
            //return early if theres no available actions
            if(actionToPerform === undefined) return false;
            //todo: perform the action

            //increment time
            globalData.shell.stepTime();
            //-----
            //finish and summarise

            return false;
        },
        "dfs" : function(globalData,values){
            if(values.length === 0) values = [globalData.shell.cwd.id];
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
