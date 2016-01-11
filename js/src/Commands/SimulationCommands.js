
define(['underscore'],function(_){

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
            
            var institutionIds = globalData.shell.dfs(sourceId,['children']);

            var characters = _.values(globalData.shell.allNode).filter(function(d){
                return d.tags.type === 'character';
            });
            
            //compile the reteNet using the rules
            globalData.shell.compileRete(institutionIds);
            //assert starting facts
            //todo: possible initialise the institution from options here
            globalData.shell.assertWMEs(institutionIds);

        },
        "stepSim" : function(globalData,values){
            console.log("Running sim turn: ",globalData.shell.reteNet.currentTime);
            //todo: maybe not?
            globalData.shell.clearActivatedRules();
            //select a character to act, remove from pool of characters
            
            //get available actions for the character
            
            //filter available actions to just those for the character
            
            //select and perform an action
            
            //reset pool of characters when empty
            
            globalData.shell.stepTime();
            //-----
            //finish and summarise
        },
        "dfs" : function(globalData,values){
            if(values.length === 0) values = [globalData.shell.cwd.id];
            console.log(globalData.shell.dfs(values[0]));
        },
        "help" : function(globalData,values){
            return {
                "setupSim" : ["$sourceId?","Initialise the retenet for simulation"],
                "stepSim" : ["", "Run a step of the simulation"],
            }
        },
    };

    return SimulationCommands;
});
