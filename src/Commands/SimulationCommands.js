
define(['underscore'],function(_){
    "use strict";

    /**
     Interface for controlling a simulation
     @exports Commands/SimulationCommands
     @implements module:Commands/CommandTemplate
     */
    var SimulationCommands = {
        /** draw 
            @param globalData
            @param values
        */
        "draw" : function(globalData,values){
            //draw list of characters

            //draw list of performed actions
        },
        /** cleanup 
            @param globalData
            @param values
        */
        "cleanup" : function(globalData,values){

        },
        /** Setup the simulation 
            @param globalData
            @param values
        */
        "setupSim" : function(globalData,values){
            console.log("Setting up simulation");
            //get all the nodes in the institution specified
            var maxTurns = values.shift() || 10;
            globalData.shell.setupSimulation(maxTurns);
        },
        /**
           stepSim : take a single turn in the simulation
           @param globalData
           @param values
        */
        "stepSim" : function(globalData,values){
            globalData.shell.stepSimulation();
        },
        /** runSim : Runs the entire simulation to end
            @param globalData
            @param values
            @returns {Bool} true on completion, false otherwise;
        */
        "runSim" : function(globalData,values){
            globalData.shell.runSimulation();
        },
        /** Depth First Search 
            @param globalData
            @param values
        */
        "dfs" : function(globalData,values){
            if(values.length === 0) { values = [globalData.shell.cwd.id]; }
            console.log(globalData.shell.dfs(values[0]));
        },
        /** Help 
            @param globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "setupSim" : ["$sourceId?","Initialise the retenet for simulation"],
                "runSim" : ["", "Run the simulation to completion"],
            };
        },
    };

    return SimulationCommands;
});
